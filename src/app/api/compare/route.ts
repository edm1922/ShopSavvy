/**
 * API route for comparing products across platforms using Serper.dev API.
 */

import { NextRequest, NextResponse } from 'next/server';
import { searchProducts } from '@/services/serper-api';
import { Product } from '@/services/types';
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
    const platformsParam = searchParams.get('platforms') || 'lazada,zalora,shein';

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

    // Search for products using Serper.dev API
    try {
      const results = await searchProducts(query, {
        platformsToSearch: platforms,
        maxPages: 1
      });

      // Apply filters
      let filteredResults = results;

      if (filters.minPrice) {
        filteredResults = filteredResults.filter(product => product.price >= filters.minPrice!);
      }

      if (filters.maxPrice) {
        filteredResults = filteredResults.filter(product => product.price <= filters.maxPrice!);
      }

      if (filters.brand) {
        filteredResults = filteredResults.filter(product =>
          product.brand?.toLowerCase().includes(filters.brand!.toLowerCase())
        );
      }

      if (filters.minRating) {
        filteredResults = filteredResults.filter(product =>
          product.rating && product.rating >= filters.minRating!
        );
      }

      // Sort the results by price (lowest first)
      filteredResults.sort((a, b) => a.price - b.price);

      console.log(`Found ${filteredResults.length} results after filtering`);

      // Return the results
      return NextResponse.json({
        success: true,
        query,
        filters,
        platforms,
        count: filteredResults.length,
        results: filteredResults
      });
    } catch (error) {
      console.error('Error searching products:', error);

      return NextResponse.json({
        success: false,
        error: `Error searching products: ${error.message}`,
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error processing comparison request:', error);

    return NextResponse.json({
      success: false,
      error: 'Error processing comparison request',
    }, { status: 500 });
  }
}
