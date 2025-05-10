/**
 * Search service using custom scrapers.
 */

import { Product } from '../scrapers/types';
import { SearchFilters } from '../shopping-apis';
import * as CustomSearch from './custom-universal-search';

/**
 * Searches for products using custom scrapers.
 *
 * @param query The search query.
 * @param filters Optional search filters.
 * @param platforms The platforms to search (default: ['lazada', 'zalora', 'shein']).
 * @param maxPages Maximum number of pages to scrape per platform (default: 5).
 * @returns A promise that resolves to an array of Product objects.
 */
export async function searchProducts(
  query: string,
  filters?: SearchFilters,
  platforms = ['lazada', 'zalora', 'shein', 'shopee'], // Focusing on fashion and beauty
  maxPages = 5,
  skipCache = false
): Promise<Product[]> {
  console.log('[UnifiedSearch] Using custom scrapers');
  if (skipCache) {
    console.log('[UnifiedSearch] Cache-busting enabled, forcing fresh results');
  }
  return CustomSearch.searchProducts(query, filters, platforms, maxPages, skipCache);
}
