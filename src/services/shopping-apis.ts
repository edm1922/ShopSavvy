/**
 * Import and re-export the interfaces from the types module.
 */
import { Product, ProductDetails, SearchFilters } from './types';
export { Product, ProductDetails, SearchFilters };

/**
 * Asynchronously searches for products based on a query and optional filters.
 *
 * @param query The search query.
 * @param filters Optional filters to apply to the search.
 * @param platforms The platforms to search (default: ['lazada', 'zalora', 'shein']).
 * @param maxPages Maximum number of pages to scrape per platform (default: 5).
 * @returns A promise that resolves to an array of Product objects matching the search criteria.
 */
export async function searchProducts(
  query: string,
  filters?: SearchFilters,
  platforms?: string[],
  maxPages: number = 5
): Promise<Product[]> {
  console.log(`[shopping-apis] Searching for: ${query}`, filters);
  console.log(`[shopping-apis] Max pages: ${maxPages}`);

  if (!query.trim()) {
    console.log('[shopping-apis] Empty query, returning empty results');
    return [];
  }

  // Check if we're in a browser environment
  const isBrowser = typeof window !== 'undefined';
  if (isBrowser) {
    console.log('[shopping-apis] Running in browser environment, using API endpoint');
    try {
      // Use the API endpoint instead of direct imports in browser environment
      const response = await fetch(`/api/search?query=${encodeURIComponent(query)}&platforms=${platforms?.join(',') || 'all'}&maxPages=${maxPages}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Search failed');
      }

      return data.results || [];
    } catch (error) {
      console.error('[shopping-apis] Error fetching from API:', error);
      return [];
    }
  }

  try {
    // Server-side code
    console.log('[shopping-apis] Running in server environment');

    // Import the Serper.dev API service
    console.log('[shopping-apis] Importing Serper.dev API service');
    const { searchProducts: serperSearch } = await import('./serper-api');

    // Don't limit to specific platforms - allow all shops
    const searchPlatforms = platforms || ['all'];

    console.log(`[shopping-apis] Using platforms: ${searchPlatforms.join(', ')}`);

    // Use the Serper.dev API service
    console.log('[shopping-apis] Calling Serper.dev API service');
    const results = await serperSearch(query, {
      maxResults: 200, // Fixed limit per API call
      maxPages: maxPages // Number of API calls to make with different query variations
    });

    console.log(`[shopping-apis] Got ${results.length} results from Serper.dev API`);

    // Don't filter by platform if 'all' is specified
    const filteredResults = searchPlatforms.includes('all')
      ? results
      : results.filter(product =>
          searchPlatforms.some(platform =>
            product.platform.toLowerCase().includes(platform.toLowerCase())
          )
        );

    // Log the platforms found
    const platformsFound = new Set(results.map(product => product.platform));
    console.log(`[shopping-apis] Platforms found: ${Array.from(platformsFound).join(', ')}`);
    console.log(`[shopping-apis] After platform filtering: ${filteredResults.length} results`);

    // Apply additional filters
    let finalResults = filteredResults;

    if (filters?.minPrice !== undefined) {
      finalResults = finalResults.filter(product => product.price >= filters.minPrice!);
    }

    if (filters?.maxPrice !== undefined) {
      finalResults = finalResults.filter(product => product.price <= filters.maxPrice!);
    }

    if (filters?.brand) {
      finalResults = finalResults.filter(product =>
        product.title.toLowerCase().includes(filters.brand!.toLowerCase())
      );
    }

    console.log(`[shopping-apis] After applying filters: ${finalResults.length} results`);

    // Return empty array if no results
    if (finalResults.length === 0) {
      console.log('[shopping-apis] No results after filtering');
      return [];
    }

    return finalResults;
  } catch (error) {
    console.error('[shopping-apis] Error searching products:', error);
    // Return empty array instead of mock data
    console.log('[shopping-apis] Returning empty results due to error');
    return [];
  }
}

// Mock products function removed - using real data only

