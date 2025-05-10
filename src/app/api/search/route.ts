/**
 * API route for searching products using Serper.dev API
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchProducts } from '@/services/serper-api';
import { Product, SearchFilters } from '@/services/types';
import { createClient } from '@supabase/supabase-js';

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
    // Don't limit to specific platforms - allow all shops
    const platformsParam = searchParams.get('platforms') || 'all';
    const maxPages = parseInt(searchParams.get('maxPages') || '1', 10); // Default to 1 page
    const forceRefresh = searchParams.get('forceRefresh') === 'true';

    // Extract filters from URL parameters
    let filters: SearchFilters = {};
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const brand = searchParams.get('brand');
    const sortBy = searchParams.get('sortBy') || undefined;

    if (minPrice) filters.minPrice = parseFloat(minPrice);
    if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
    if (brand) filters.brand = brand;

    // Parse platforms
    const platforms = platformsParam.split(',');

    // Validate the query
    if (!query) {
      return NextResponse.json({
        success: false,
        error: 'Search query is required',
      }, { status: 400 });
    }

    console.log(`[SearchAPI] Searching for "${query}" on platforms: ${platforms.join(', ')}`);
    console.log('[SearchAPI] Filters:', filters);
    console.log('[SearchAPI] Sort by:', sortBy);
    console.log('[SearchAPI] Force refresh:', forceRefresh);

    // Search for products using Serper.dev API
    let results: Product[] = [];
    const errors: string[] = [];

    try {
      console.log(`[SearchAPI] Searching for "${query}" using Serper.dev API`);

      // Call the Serper.dev API
      // Pass maxPages to make multiple API calls with different query variations
      // This will simulate pagination and get more diverse results

      // If forceRefresh is true, we want to completely bypass the cache
      // and get fresh results for all platforms
      if (forceRefresh) {
        console.log(`[SearchAPI] Force refresh requested, bypassing cache completely`);

        // First, get any existing cached results to see what platforms we have
        const tempResults = await searchProducts(query, {
          useCache: true, // Temporarily use cache just to check what we have
          maxResults: 1,  // We don't need actual results, just checking platforms
          maxPages: 1     // Minimal API usage
        });

        // Then do a fresh search with cache disabled
        results = await searchProducts(query, {
          useCache: false, // Disable cache to get fresh results
          maxResults: 200, // Fixed limit per API call
          maxPages: maxPages, // Number of API calls to make with different query variations
          forceRefreshAll: true // New flag to indicate we want to refresh all platforms
        });

        console.log(`[SearchAPI] Force refresh completed, got ${results.length} fresh results`);
      } else {
        // Check if we need to implement platform-specific caching
        // This happens when the user clicks the regular search button
        // We want to use cached results for platforms we already have
        // and only fetch fresh results for platforms we don't have

        // First, get any existing cached results to see what platforms we have
        const cachedResults = await searchProducts(query, {
          useCache: true, // Use cache to check what we have
          maxResults: 1,  // We don't need actual results, just checking platforms
          maxPages: 1     // Minimal API usage
        });

        // Get the platforms we already have in cache
        const cachedPlatforms = new Set();
        if (cachedResults && cachedResults.length > 0) {
          cachedResults.forEach(product => {
            if (product.platform) {
              cachedPlatforms.add(product.platform.toLowerCase());
            }
          });
        }

        console.log(`[SearchAPI] Found cached results for platforms: ${Array.from(cachedPlatforms).join(', ')}`);

        // Define the major platforms we support
        const majorPlatforms = ['lazada', 'zalora', 'shein'];

        // Determine which platforms we need to search for
        const platformsToSearch = majorPlatforms.filter(platform =>
          !cachedPlatforms.has(platform)
        );

        if (platformsToSearch.length > 0) {
          console.log(`[SearchAPI] Need to search for additional platforms: ${platformsToSearch.join(', ')}`);

          // Do a search for just the missing platforms
          const newResults = await searchProducts(query, {
            useCache: true, // Enable cache for the search
            maxResults: 200, // Fixed limit per API call
            maxPages: maxPages, // Number of API calls to make with different query variations
            platformsToSearch: platformsToSearch // Only search for missing platforms
          });

          console.log(`[SearchAPI] Got ${newResults.length} new results for missing platforms`);

          // Combine with cached results
          results = [...cachedResults, ...newResults];
          console.log(`[SearchAPI] Combined results: ${results.length} total`);
        } else {
          console.log(`[SearchAPI] All major platforms are already cached, using cached results`);
          results = cachedResults;
        }
      }

      console.log(`[SearchAPI] Found ${results.length} results from Serper.dev API`);

      // Don't filter by platform - include all shops
      // Just log the platforms found for debugging
      const platformsFound = new Set(results.map(product => product.platform));
      console.log(`[SearchAPI] Platforms found: ${Array.from(platformsFound).join(', ')}`);
      console.log(`[SearchAPI] Total results before filtering: ${results.length}`);

      // Apply additional filters
      if (minPrice !== null) {
        results = results.filter(product => product.price >= parseFloat(minPrice!));
      }

      if (maxPrice !== null) {
        results = results.filter(product => product.price <= parseFloat(maxPrice!));
      }

      if (brand) {
        results = results.filter(product =>
          product.title.toLowerCase().includes(brand.toLowerCase())
        );
      }

      console.log(`[SearchAPI] After applying filters: ${results.length} results`);
    } catch (error: any) {
      console.error('[SearchAPI] Error during search process:', error);
      errors.push(`Error during search process: ${error.message}`);
    }

    // Sort the results if requested
    if (sortBy) {
      sortResults(results, sortBy);
    }

    // Save the search query to the database (but don't wait for it to complete)
    saveSearchQuery(query, query, platforms, filters, results.length).catch(err => {
      console.warn('Failed to save search query, but continuing with response:', err);
    });

    // Return the results
    return NextResponse.json({
      success: true,
      query: query,
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
      // Sort by price ascending (cheapest first)
      results.sort((a, b) => a.price - b.price);
      console.log('[SearchAPI] Sorted results by price ascending (cheapest first)');
      break;

    case 'price_desc':
      // Sort by price descending (most expensive first)
      results.sort((a, b) => b.price - a.price);
      console.log('[SearchAPI] Sorted results by price descending (most expensive first)');
      break;

    case 'rating_desc':
      // Sort by rating descending (highest rated first)
      results.sort((a, b) => {
        const ratingA = a.rating || 0;
        const ratingB = b.rating || 0;
        return ratingB - ratingA;
      });
      console.log('[SearchAPI] Sorted results by rating descending (highest rated first)');
      break;

    case 'popularity_desc':
      // Sort by popularity/sales descending (most popular first)
      // First try to sort by sales if available
      const hasSales = results.some(product => product.sales !== undefined && product.sales > 0);

      if (hasSales) {
        results.sort((a, b) => {
          const salesA = a.sales || 0;
          const salesB = b.sales || 0;
          return salesB - salesA;
        });
        console.log('[SearchAPI] Sorted results by sales descending (most popular first)');
      } else {
        // Fall back to rating and then review count if sales data isn't available
        results.sort((a, b) => {
          const ratingA = a.rating || 0;
          const ratingB = b.rating || 0;

          // If ratings are the same, sort by review count
          if (ratingA === ratingB) {
            const reviewsA = a.ratingCount || 0;
            const reviewsB = b.ratingCount || 0;
            return reviewsB - reviewsA;
          }

          return ratingB - ratingA;
        });
        console.log('[SearchAPI] Sorted results by rating and review count (as popularity proxy)');
      }
      break;

    case 'date_desc':
      // For newest items, we don't have direct date information
      // Use a combination of factors that might indicate newer items
      // This is a best-effort approach since we don't have actual date data
      results.sort((a, b) => {
        // Prioritize items with "new" in the title
        const aHasNew = a.title.toLowerCase().includes('new');
        const bHasNew = b.title.toLowerCase().includes('new');

        if (aHasNew && !bHasNew) return -1;
        if (!aHasNew && bHasNew) return 1;

        // Then try to use rating count as a proxy for recency
        // Items with fewer ratings might be newer
        const reviewsA = a.ratingCount || 0;
        const reviewsB = b.ratingCount || 0;

        // If both have ratings, assume fewer ratings means newer
        if (reviewsA > 0 && reviewsB > 0) {
          return reviewsA - reviewsB;
        }

        // If only one has ratings, the one without ratings might be newer
        if (reviewsA > 0 && reviewsB === 0) return 1;
        if (reviewsA === 0 && reviewsB > 0) return -1;

        // Default to no change in order
        return 0;
      });
      console.log('[SearchAPI] Sorted results to prioritize potentially newer items');
      break;

    default:
      // No sorting - use the default order from the API
      console.log('[SearchAPI] No sorting applied, using default order');
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
