/**
 * Custom universal search implementation using direct scrapers with caching.
 */

import { Product } from '../scrapers/types';
import { SearchFilters } from '../shopping-apis';
import { getScraperForPlatform } from '../scrapers/scraper-factory-server';
import { SupabaseCache } from '../cache/supabase-cache';

/**
 * Searches for products across multiple platforms using direct scrapers with caching.
 *
 * @param query The search query.
 * @param filters Optional search filters.
 * @param platforms The platforms to search (default: ['shopee', 'lazada']).
 * @returns A promise that resolves to an array of Product objects.
 */
export async function searchProducts(
  query: string, 
  filters?: SearchFilters,
  platforms = ['shopee', 'lazada']
): Promise<Product[]> {
  console.log(`[CustomUniversalSearch] Searching for: "${query}" on platforms: ${platforms.join(', ')}`);
  
  // Initialize cache
  const cache = new SupabaseCache();
  
  try {
    // Try to get results from cache first
    const cachedResults = await cache.getCachedSearch(query, platforms);
    if (cachedResults && cachedResults.length > 0) {
      console.log(`[CustomUniversalSearch] Using cached results for query: "${query}"`);
      return applyFilters(cachedResults, filters);
    }
    
    // If not in cache, fetch from scrapers
    console.log(`[CustomUniversalSearch] Fetching fresh results for query: "${query}"`);
    
    // Run scrapers in parallel
    const searchPromises = platforms.map(platform => {
      try {
        const scraper = getScraperForPlatform(platform);
        return scraper.searchProducts(query, filters);
      } catch (error) {
        console.error(`[CustomUniversalSearch] Error with scraper for ${platform}:`, error);
        return Promise.resolve([]);
      }
    });
    
    // Wait for all scrapers to complete
    const results = await Promise.all(searchPromises);
    
    // Merge results
    const mergedResults = results.flat();
    console.log(`[CustomUniversalSearch] Got ${mergedResults.length} total results from all platforms`);
    
    // Remove duplicates based on title and platform
    const uniqueResults = removeDuplicates(mergedResults);
    console.log(`[CustomUniversalSearch] After removing duplicates: ${uniqueResults.length} results`);
    
    // Cache the results
    await cache.cacheSearchResults(query, platforms, uniqueResults);
    
    // Apply filters
    return applyFilters(uniqueResults, filters);
  } catch (error) {
    console.error('[CustomUniversalSearch] Error in searchProducts:', error);
    return [];
  }
}

/**
 * Removes duplicate products based on title and platform.
 *
 * @param products The array of products to deduplicate.
 * @returns An array of unique products.
 */
function removeDuplicates(products: Product[]): Product[] {
  const seen = new Set<string>();
  
  return products.filter(product => {
    // Create a unique key for each product based on title and platform
    const key = `${product.title.toLowerCase()}_${product.platform.toLowerCase()}`;
    
    // Check if we've seen this product before
    if (seen.has(key)) {
      return false;
    }
    
    // Add the product to the seen set
    seen.add(key);
    
    return true;
  });
}

/**
 * Applies filters to a list of products.
 *
 * @param products The products to filter.
 * @param filters The filters to apply.
 * @returns The filtered products.
 */
function applyFilters(products: Product[], filters?: SearchFilters): Product[] {
  if (!filters) {
    return products;
  }
  
  let filteredProducts = [...products];
  
  // Apply price filters
  if (filters.minPrice !== undefined) {
    filteredProducts = filteredProducts.filter(p => p.price >= filters.minPrice!);
  }
  
  if (filters.maxPrice !== undefined) {
    filteredProducts = filteredProducts.filter(p => p.price <= filters.maxPrice!);
  }
  
  // Apply brand filter
  if (filters.brand) {
    const brandLower = filters.brand.toLowerCase();
    filteredProducts = filteredProducts.filter(p => 
      p.title.toLowerCase().includes(brandLower)
    );
  }
  
  // Apply rating filter
  if (filters.minRating !== undefined) {
    filteredProducts = filteredProducts.filter(p => 
      (p.rating || 0) >= filters.minRating!
    );
  }
  
  return filteredProducts;
}
