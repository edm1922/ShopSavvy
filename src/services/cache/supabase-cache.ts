/**
 * Supabase cache implementation for storing search results.
 */

import { createClient } from '@supabase/supabase-js';
import { Product } from '../scrapers/types';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://olazrafayxrpqyajufle.supabase.co';
// Use the service role key directly for server-side operations
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sYXpyYWZheXhycHF5YWp1ZmxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY2OTE3NywiZXhwIjoyMDYyMjQ1MTc3fQ.uobIqILTZmxJ9SS_sLZ4Y0n8dW7Y6E4BEZMxm-8SCyk';
console.log('[SupabaseCache] Initializing with URL:', supabaseUrl);
console.log('[SupabaseCache] Using service role key');
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Supabase cache service for storing and retrieving search results.
 */
export class SupabaseCache {
  // Cache duration in seconds (default: 6 hours)
  private cacheDuration = 6 * 60 * 60;

  /**
   * Set custom cache duration.
   *
   * @param seconds The cache duration in seconds.
   */
  setCacheDuration(seconds: number) {
    this.cacheDuration = seconds;
  }

  /**
   * Get cached search results.
   *
   * @param query The search query.
   * @param platforms The platforms to search.
   * @returns A promise that resolves to an array of Product objects, or null if not found in cache.
   */
  async getCachedSearch(query: string, platforms: string[]): Promise<Product[] | null> {
    try {
      console.log(`[SupabaseCache] Checking cache for query: "${query}" on platforms: ${platforms.join(', ')}`);

      // Sort platforms to ensure consistent cache keys
      const sortedPlatforms = [...platforms].sort();

      const { data, error } = await supabase
        .from('search_cache')
        .select('*')
        .eq('search_query', query.toLowerCase())
        .contains('platforms', sortedPlatforms)
        .gte('expires_at', new Date().toISOString())
        .single();

      if (error || !data) {
        console.log(`[SupabaseCache] Cache miss for query: "${query}"`);
        return null;
      }

      console.log(`[SupabaseCache] Cache hit for query: "${query}", found ${data.results.length} results`);
      return data.results;
    } catch (error) {
      console.error('[SupabaseCache] Error getting cached search:', error);
      return null;
    }
  }

  /**
   * Store search results in cache.
   *
   * @param query The search query.
   * @param platforms The platforms that were searched.
   * @param results The search results to cache.
   * @returns A promise that resolves when the cache operation is complete.
   */
  async cacheSearchResults(query: string, platforms: string[], results: Product[]): Promise<void> {
    try {
      console.log(`[SupabaseCache] Caching ${results.length} results for query: "${query}"`);

      // Sort platforms to ensure consistent cache keys
      const sortedPlatforms = [...platforms].sort();

      // Calculate expiration time
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + this.cacheDuration);

      // Upsert the cache entry
      const { error } = await supabase
        .from('search_cache')
        .upsert({
          search_query: query.toLowerCase(),
          platforms: sortedPlatforms,
          results,
          created_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString()
        }, {
          onConflict: 'search_query,platforms'
        });

      if (error) {
        console.error('[SupabaseCache] Error caching search results:', error);
      } else {
        console.log(`[SupabaseCache] Successfully cached results for query: "${query}"`);
      }
    } catch (error) {
      console.error('[SupabaseCache] Error caching search results:', error);
    }
  }

  /**
   * Clear expired cache entries.
   *
   * @returns A promise that resolves when the cleanup operation is complete.
   */
  async clearExpiredCache(): Promise<void> {
    try {
      console.log('[SupabaseCache] Clearing expired cache entries');

      const { error, count } = await supabase
        .from('search_cache')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) {
        console.error('[SupabaseCache] Error clearing expired cache:', error);
      } else {
        console.log(`[SupabaseCache] Cleared ${count || 0} expired cache entries`);
      }
    } catch (error) {
      console.error('[SupabaseCache] Error clearing expired cache:', error);
    }
  }
}
