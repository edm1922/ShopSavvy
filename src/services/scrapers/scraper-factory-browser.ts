/**
 * Browser-safe factory for creating platform-specific scrapers.
 * 
 * This version is safe to import on the client side and provides mock implementations
 * that will be replaced with real implementations on the server.
 */

import { ScraperInterface, Product, ProductDetails, ProductReview, SearchFilters } from './types';

/**
 * A mock scraper that returns empty results.
 * This is used on the client side to avoid bundling server-only code.
 */
class MockScraper implements ScraperInterface {
  async searchProducts(query: string, filters?: SearchFilters): Promise<Product[]> {
    console.warn('MockScraper: searchProducts called in browser environment');
    return [];
  }

  async getProductDetails(productId: string): Promise<ProductDetails | null> {
    console.warn('MockScraper: getProductDetails called in browser environment');
    return null;
  }

  async getProductReviews(productId: string): Promise<ProductReview[]> {
    console.warn('MockScraper: getProductReviews called in browser environment');
    return [];
  }

  async close(): Promise<void> {
    // No-op
  }
}

/**
 * Gets a mock scraper for the specified platform.
 * This is safe to use on the client side.
 *
 * @param platform The platform name (e.g., 'shopee', 'lazada').
 * @returns A mock scraper instance.
 */
export function getScraperForPlatform(platform: string): ScraperInterface {
  return new MockScraper();
}

/**
 * Gets mock scrapers for all supported platforms.
 * This is safe to use on the client side.
 *
 * @returns An array of mock scraper instances.
 */
export function getAllScrapers(): ScraperInterface[] {
  return [new MockScraper(), new MockScraper()];
}

/**
 * Gets the names of all supported platforms.
 *
 * @returns An array of platform names.
 */
export function getSupportedPlatforms(): string[] {
  return [
    'Shopee',
    'Lazada',
    // Add more platforms as they are implemented
  ];
}
