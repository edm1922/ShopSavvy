/**
 * API route for searching products across multiple platforms.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getScraperForPlatform } from '@/services/scrapers/scraper-factory-server';
import { Product } from '@/services/scrapers/types';
import { parseNaturalLanguageQuery } from '@/services/search/advanced-search-parser';
import { SearchFilters } from '@/services/shopping-apis';
import { createClient } from '@supabase/supabase-js';
import * as SearchService from '@/services/search';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://olazrafayxrpqyajufle.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sYXpyYWZheXhycHF5YWp1ZmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTc0MzA0MzcsImV4cCI6MjAzMzAwNjQzN30.Yd_QlIFR-9xKVIxzP-DiDzvYJI7W1ZK5UUXpLznOlpQ';

// Log the Supabase configuration
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Key (first 10 chars):', supabaseKey.substring(0, 10));

// Create the Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Handles GET requests to the search API.
 *
 * @param request The Next.js request object.
 * @returns A promise that resolves to a Next.js response.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get the search parameters from the URL
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || '';
    const platformsParam = searchParams.get('platforms') || 'Shopee,Lazada';
    const isNaturalLanguage = searchParams.get('natural') === 'true';

    // Parse the natural language query if enabled
    let parsedQuery = query;
    let filters: SearchFilters = {};
    let platforms = platformsParam.split(',');
    let sortBy = searchParams.get('sortBy') || undefined;

    if (isNaturalLanguage && query) {
      const parsed = parseNaturalLanguageQuery(query);
      parsedQuery = parsed.query;
      filters = parsed.filters;

      if (parsed.platforms && parsed.platforms.length > 0) {
        platforms = parsed.platforms;
      }

      if (parsed.sortBy) {
        sortBy = parsed.sortBy;
      }
    } else {
      // Extract filters from URL parameters
      const minPrice = searchParams.get('minPrice');
      const maxPrice = searchParams.get('maxPrice');
      const brand = searchParams.get('brand');
      const minRating = searchParams.get('minRating');

      if (minPrice) filters.minPrice = parseFloat(minPrice);
      if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
      if (brand) filters.brand = brand;
      if (minRating) filters.minRating = parseFloat(minRating);
    }

    // Validate the query
    if (!parsedQuery) {
      return NextResponse.json({
        success: false,
        error: 'Search query is required',
      }, { status: 400 });
    }

    console.log(`Searching for "${parsedQuery}" on platforms: ${platforms.join(', ')}`);
    console.log('Filters:', filters);
    console.log('Sort by:', sortBy);

    // Search for products using Serper.dev API as the primary search method
    let results: Product[] = [];
    const errors: string[] = [];

    try {
      console.log(`Searching for "${parsedQuery}" across all marketplaces`);

      // Use the unified search service (will use either Serper.dev API or custom scrapers based on feature flag)
      results = await SearchService.searchProducts(
        parsedQuery,
        filters,
        platforms
      );

      console.log(`Found ${results.length} results`);

      // Log the breakdown of results by platform
      const resultsByPlatform = platforms.map(platform => {
        const platformResults = results.filter(product =>
          product.platform.toLowerCase() === platform.toLowerCase()
        );
        return {
          platform,
          count: platformResults.length
        };
      });

      console.log('Results by platform:', resultsByPlatform);

      // Check if any platforms have no results
      const platformsWithNoResults = resultsByPlatform
        .filter(p => p.count === 0)
        .map(p => p.platform);

      if (platformsWithNoResults.length > 0) {
        console.log(`No results found for platforms: ${platformsWithNoResults.join(', ')}`);
      }
    } catch (error) {
      console.error('Error during search process:', error);
      errors.push(`Error during search process: ${error.message}`);
    }

    // Sort the results if requested
    if (sortBy) {
      sortResults(results, sortBy);
    }

    // Save the search query to the database (but don't wait for it to complete)
    saveSearchQuery(query, parsedQuery, platforms, filters, results.length).catch(err => {
      console.warn('Failed to save search query, but continuing with response:', err);
    });

    // Return the results
    return NextResponse.json({
      success: true,
      query: parsedQuery,
      filters,
      platforms,
      sortBy,
      count: results.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error processing search request:', error);

    return NextResponse.json({
      success: false,
      error: 'Error processing search request',
    }, { status: 500 });
  }
}

/**
 * Sorts the search results based on the specified sort order.
 *
 * @param results The search results to sort.
 * @param sortBy The sort order.
 */
function sortResults(results: Product[], sortBy: string): void {
  switch (sortBy) {
    case 'price_asc':
      results.sort((a, b) => a.price - b.price);
      break;
    case 'price_desc':
      results.sort((a, b) => b.price - a.price);
      break;
    case 'rating_desc':
      results.sort((a, b) => {
        const ratingA = a.rating || 0;
        const ratingB = b.rating || 0;
        return ratingB - ratingA;
      });
      break;
    case 'popularity_desc':
      results.sort((a, b) => {
        const salesA = a.sales || 0;
        const salesB = b.sales || 0;
        return salesB - salesA;
      });
      break;
    default:
      // No sorting
      break;
  }
}

/**
 * Saves the search query to the database.
 *
 * @param originalQuery The original search query.
 * @param parsedQuery The parsed search query.
 * @param platforms The platforms searched.
 * @param filters The filters applied.
 * @param resultCount The number of results found.
 */
async function saveSearchQuery(
  originalQuery: string,
  parsedQuery: string,
  platforms: string[],
  filters: SearchFilters,
  resultCount: number
): Promise<void> {
  try {
    // Check if Supabase client is initialized
    if (!supabase) {
      console.error('Supabase client is not initialized');
      return;
    }

    // Check if the search_history table exists
    const { error: tableCheckError } = await supabase
      .from('search_history')
      .select('count(*)')
      .limit(1)
      .single();

    if (tableCheckError) {
      console.warn('search_history table may not exist or is not accessible:', tableCheckError.message);
      console.log('Skipping search history saving');
      return;
    }

    // Save the search query to the database
    const { error } = await supabase
      .from('search_history')
      .insert({
        original_query: originalQuery,
        parsed_query: parsedQuery,
        platforms: platforms.join(','),
        filters: JSON.stringify(filters),
        result_count: resultCount,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error saving search query to database:', error);
    } else {
      console.log('Successfully saved search query to database');
    }
  } catch (error) {
    console.error('Error saving search query to database:', error);
  }
}
