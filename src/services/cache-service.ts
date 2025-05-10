import { Product } from '@/services/types';

// Define the structure of our cache items
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number; // Expiry time in milliseconds
}

// Define cache keys
export const CACHE_KEYS = {
  SEARCH_RESULTS: 'shopsavvy_search_results',
  RECENT_SEARCHES: 'shopsavvy_recent_searches',
};

/**
 * A service for caching data in localStorage with expiration
 */
export const cacheService = {
  /**
   * Set an item in the cache with expiration
   *
   * @param key The cache key
   * @param data The data to cache
   * @param expiryTime Time in milliseconds until the cache expires (default: 30 minutes)
   */
  set<T>(key: string, data: T, expiryTime: number = 30 * 60 * 1000): void {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        expiry: expiryTime,
      };
      localStorage.setItem(key, JSON.stringify(cacheItem));
    } catch (error) {
      console.error('Error setting cache:', error);
    }
  },

  /**
   * Get an item from the cache
   *
   * @param key The cache key
   * @returns The cached data or null if not found or expired
   */
  get<T>(key: string): T | null {
    try {
      const cachedData = localStorage.getItem(key);
      if (!cachedData) return null;

      const cacheItem: CacheItem<T> = JSON.parse(cachedData);
      const now = Date.now();

      // Check if the cache has expired
      if (now - cacheItem.timestamp > cacheItem.expiry) {
        localStorage.removeItem(key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.error('Error getting cache:', error);
      return null;
    }
  },

  /**
   * Remove an item from the cache
   *
   * @param key The cache key
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing cache:', error);
    }
  },

  /**
   * Clear all cache items
   */
  clear(): void {
    try {
      Object.values(CACHE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  },

  /**
   * Get cached search results for a specific query and filters
   *
   * @param query The search query
   * @param filters The search filters
   * @param platforms The platforms to search
   * @param maxPages The maximum number of pages to fetch
   * @returns The cached search results or null if not found
   */
  getSearchResults(
    query: string,
    filters: any,
    platforms: string[],
    maxPages: number
  ): Product[] | null {
    try {
      // Create a cache key based on the search parameters
      const cacheKey = `${CACHE_KEYS.SEARCH_RESULTS}_${query}_${JSON.stringify(filters)}_${platforms.join(',')}_${maxPages}`;
      return this.get<Product[]>(cacheKey);
    } catch (error) {
      console.error('Error getting cached search results:', error);
      return null;
    }
  },

  /**
   * Cache search results for a specific query and filters
   *
   * @param query The search query
   * @param filters The search filters
   * @param platforms The platforms to search
   * @param maxPages The maximum number of pages to fetch
   * @param results The search results to cache
   */
  setSearchResults(
    query: string,
    filters: any,
    platforms: string[],
    maxPages: number,
    results: Product[]
  ): void {
    try {
      // Create a cache key based on the search parameters
      const cacheKey = `${CACHE_KEYS.SEARCH_RESULTS}_${query}_${JSON.stringify(filters)}_${platforms.join(',')}_${maxPages}`;
      this.set<Product[]>(cacheKey, results);
    } catch (error) {
      console.error('Error caching search results:', error);
    }
  },

  /**
   * Clear cached search results for a specific query and filters
   *
   * @param query The search query
   * @param filters The search filters
   * @param platforms The platforms to search
   */
  clearSearchResults(
    query: string,
    filters: any,
    platforms: string[]
  ): void {
    try {
      // Create cache keys for all possible page counts (1-10)
      for (let maxPages = 1; maxPages <= 10; maxPages++) {
        const cacheKey = `${CACHE_KEYS.SEARCH_RESULTS}_${query}_${JSON.stringify(filters)}_${platforms.join(',')}_${maxPages}`;
        this.remove(cacheKey);
      }
      console.log(`Cleared cache for search: ${query}`);
    } catch (error) {
      console.error('Error clearing cached search results:', error);
    }
  }
};
