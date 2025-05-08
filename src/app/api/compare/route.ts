/**
 * API route for comparing products across platforms.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getScraperForPlatform } from '@/services/scrapers/scraper-factory-server';
import { Product } from '@/services/scrapers/types';
import { SearchFilters } from '@/services/shopping-apis';

/**
 * Handles GET requests to the product comparison API.
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
    
    // Parse the platforms
    const platforms = platformsParam.split(',');
    
    console.log(`Comparing products for "${query}" on platforms: ${platforms.join(', ')}`);
    console.log('Filters:', filters);
    
    // Search for products on each platform
    const results: Product[] = [];
    const errors: string[] = [];
    
    for (const platform of platforms) {
      try {
        const scraper = getScraperForPlatform(platform);
        const platformResults = await scraper.searchProducts(query, filters);
        
        console.log(`Found ${platformResults.length} results on ${platform}`);
        
        results.push(...platformResults);
      } catch (error) {
        console.error(`Error searching on ${platform}:`, error);
        errors.push(`Error searching on ${platform}: ${error.message}`);
      }
    }
    
    // Sort the results by price (lowest first)
    results.sort((a, b) => a.price - b.price);
    
    // Return the results
    return NextResponse.json({
      success: true,
      query,
      filters,
      platforms,
      count: results.length,
      results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error processing comparison request:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error processing comparison request',
    }, { status: 500 });
  }
}
