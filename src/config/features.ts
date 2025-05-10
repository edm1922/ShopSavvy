/**
 * Feature flags for the application.
 */

export const FEATURES = {
  /**
   * Whether to enable debug mode for scrapers.
   */
  DEBUG_SCRAPERS: process.env.NEXT_PUBLIC_DEBUG_SCRAPERS === 'true',

  /**
   * Whether to enable caching for search results.
   */
  ENABLE_SEARCH_CACHE: process.env.NEXT_PUBLIC_ENABLE_SEARCH_CACHE !== 'false'
};
