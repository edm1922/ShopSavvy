/**
 * This file is a placeholder for the custom crawler functionality
 * that has been replaced by the Serper.dev API.
 *
 * All custom crawler functionality has been removed as part of the
 * simplification of the ShopSavvy app to use Serper.dev API instead.
 */

import { Product } from '@/services/types';

/**
 * Dummy class that would normally contain the custom crawler functionality
 * This is kept as a placeholder to avoid breaking imports in other files
 * that might still reference this module.
 */
export class CustomCrawler {
  /**
   * Initialize the crawler (dummy implementation)
   */
  public async initialize(): Promise<void> {
    console.log(`[CustomCrawler] Initialize method called, but functionality has been replaced by Serper.dev API`);
    return;
  }

  /**
   * Close the crawler (dummy implementation)
   */
  public async close(): Promise<void> {
    console.log(`[CustomCrawler] Close method called, but functionality has been replaced by Serper.dev API`);
    return;
  }

  /**
   * Check if the crawler is initialized (dummy implementation)
   */
  public isInitialized(): boolean {
    return false;
  }

  /**
   * Search for products on a platform (dummy implementation)
   *
   * This method supports both single platform (string) and multiple platforms (array)
   * to maintain compatibility with existing code.
   */
  public async searchProducts(query: string, platformOrPlatforms: string | string[], maxPages: number = 1): Promise<Product[]> {
    console.log(`[CustomCrawler] searchProducts called with query "${query}", but functionality has been replaced by Serper.dev API`);

    // Log the platforms being searched
    if (Array.isArray(platformOrPlatforms)) {
      console.log(`[CustomCrawler] Platforms: ${platformOrPlatforms.join(', ')}`);
    } else {
      console.log(`[CustomCrawler] Platform: ${platformOrPlatforms}`);
    }

    // Log max pages parameter
    console.log(`[CustomCrawler] Max pages: ${maxPages}`);

    return [];
  }

  /**
   * Search for products across multiple platforms (dummy implementation)
   */
  public async searchAcrossPlatforms(query: string, platforms: string[], maxPages: number = 1): Promise<Product[]> {
    console.log(`[CustomCrawler] searchAcrossPlatforms called with query "${query}", but functionality has been replaced by Serper.dev API`);
    console.log(`[CustomCrawler] Platforms: ${platforms.join(', ')}`);
    console.log(`[CustomCrawler] Max pages: ${maxPages}`);
    return [];
  }
}

// Export a singleton instance
export const customCrawler = new CustomCrawler();
