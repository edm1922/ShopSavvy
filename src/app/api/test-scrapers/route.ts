/**
 * API route for testing custom scrapers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { Product } from '@/services/scrapers/types';
import { SearchFilters } from '@/services/shopping-apis';
import * as CustomSearch from '@/services/search/custom-universal-search';

/**
 * Handles GET requests to the test scrapers API.
 *
 * @param request The Next.js request object.
 * @returns A promise that resolves to a Next.js response.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get the search parameters from the URL
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || '';
    const platformsParam = searchParams.get('platforms') || 'shopee,lazada';
    const useCache = searchParams.get('useCache') !== 'false'; // Default to true
    
    // Parse platforms
    const platforms = platformsParam.split(',');
    
    // Extract filters from URL parameters
    const filters: SearchFilters = {};
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const brand = searchParams.get('brand');
    const minRating = searchParams.get('minRating');
    
    if (minPrice) filters.minPrice = parseFloat(minPrice);
    if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
    if (brand) filters.brand = brand;
    if (minRating) filters.minRating = parseFloat(minRating);
    
    // Validate the query
    if (!query) {
      return NextResponse.json({
        success: false,
        error: 'Search query is required',
      }, { status: 400 });
    }
    
    console.log(`[TestScrapers] Searching for "${query}" on platforms: ${platforms.join(', ')}`);
    console.log('[TestScrapers] Use cache:', useCache);
    console.log('[TestScrapers] Filters:', filters);
    
    // Override the cache usage if needed
    if (!useCache) {
      // This is a hack to bypass the cache
      // Add a random string to the query to ensure it's not in the cache
      const randomSuffix = Math.random().toString(36).substring(2, 10);
      const results = await CustomSearch.searchProducts(
        `${query}_${randomSuffix}`,
        filters,
        platforms
      );
      
      // Return the results
      return NextResponse.json({
        success: true,
        query,
        filters,
        platforms,
        useCache,
        count: results.length,
        results,
      });
    }
    
    // Search for products using custom scrapers
    const results = await CustomSearch.searchProducts(
      query,
      filters,
      platforms
    );
    
    console.log(`[TestScrapers] Found ${results.length} results`);
    
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
    
    console.log('[TestScrapers] Results by platform:', resultsByPlatform);
    
    // Return the results
    return NextResponse.json({
      success: true,
      query,
      filters,
      platforms,
      useCache,
      count: results.length,
      results,
    });
  } catch (error) {
    console.error('[TestScrapers] Error processing search request:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error processing search request',
    }, { status: 500 });
  }
}
