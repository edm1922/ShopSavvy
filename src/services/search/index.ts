/**
 * Unified search service that can switch between Serper.dev API and custom scrapers.
 */

import { Product } from '../scrapers/types';
import { SearchFilters } from '../shopping-apis';
import { FEATURES } from '../../config/features';
import * as SerperSearch from './universal-search';
import * as CustomSearch from './custom-universal-search';

/**
 * Searches for products using either Serper.dev API or custom scrapers based on feature flag.
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
  // Debug log to see the value of the feature flag
  console.log('[UnifiedSearch] FEATURES.USE_CUSTOM_SCRAPERS:', FEATURES.USE_CUSTOM_SCRAPERS);
  console.log('[UnifiedSearch] process.env.NEXT_PUBLIC_USE_CUSTOM_SCRAPERS:', process.env.NEXT_PUBLIC_USE_CUSTOM_SCRAPERS);

  console.log(`[UnifiedSearch] Using ${FEATURES.USE_CUSTOM_SCRAPERS ? 'custom scrapers' : 'Serper.dev API'}`);

  if (FEATURES.USE_CUSTOM_SCRAPERS) {
    console.log('[UnifiedSearch] Using custom scrapers');
    return CustomSearch.searchProducts(query, filters, platforms);
  } else {
    console.log('[UnifiedSearch] Using Serper.dev API');
    return SerperSearch.searchProducts(query, filters, {
      platformFilter: platforms
    });
  }
}
