/**
 * Universal product search service.
 *
 * This service provides a unified interface for searching products across multiple sources.
 */

import { Product } from '../scrapers/types';
import { SearchFilters } from '../shopping-apis';
import * as SerperAPI from './serper-api';

/**
 * Search source options.
 * Note: We're now only using Serper.dev API as the primary search method.
 */
export enum SearchSource {
  SERPER = 'serper',
}

/**
 * Search options.
 */
export interface SearchOptions {
  source?: SearchSource;
  page?: number;
  country?: string;
  language?: string;
  platformFilter?: string[];
}

/**
 * Searches for products across multiple sources.
 *
 * @param query The search query.
 * @param filters Optional search filters.
 * @param options Optional search options.
 * @returns A promise that resolves to an array of Product objects.
 */
export async function searchProducts(
  query: string,
  filters?: SearchFilters,
  options?: SearchOptions
): Promise<Product[]> {
  // Set default options
  const defaultOptions: SearchOptions = {
    source: SearchSource.SERPER, // Only Serper.dev API is used now
    page: 1,
    country: 'ph',
    language: 'en',
  };

  // Merge default options with provided options
  const mergedOptions = { ...defaultOptions, ...options };

  console.log(`[UniversalSearch] Searching for: ${query}`, filters, mergedOptions);

  try {
    // Search using Serper.dev API
    console.log(`[UniversalSearch] Calling SerperAPI.searchProducts with query: ${query}`);
    let products = await SerperAPI.searchProducts(
      query,
      filters,
      mergedOptions.page,
      mergedOptions.country,
      mergedOptions.language
    );

    console.log(`[UniversalSearch] SerperAPI returned ${products.length} products`);

    // Filter products by platform if specified
    if (mergedOptions.platformFilter && mergedOptions.platformFilter.length > 0) {
      console.log(`[UniversalSearch] Filtering products by platforms: ${mergedOptions.platformFilter.join(', ')}`);

      const beforeFilterCount = products.length;
      products = products.filter(product =>
        mergedOptions.platformFilter!.some(platform =>
          product.platform.toLowerCase() === platform.toLowerCase()
        )
      );

      console.log(`[UniversalSearch] After platform filtering: ${products.length} products (removed ${beforeFilterCount - products.length})`);

      // Log platforms found in the results
      const platformsFound = [...new Set(products.map(p => p.platform))];
      console.log(`[UniversalSearch] Platforms found in results: ${platformsFound.join(', ')}`);
    }

    // Remove duplicates based on title and platform
    const uniqueProducts = removeDuplicates(products);

    console.log(`[UniversalSearch] After removing duplicates: ${uniqueProducts.length} products`);

    return uniqueProducts;
  } catch (error) {
    console.error('[UniversalSearch] Error in searchProducts:', error);
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
