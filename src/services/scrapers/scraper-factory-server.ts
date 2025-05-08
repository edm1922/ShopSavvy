/**
 * Server-only factory for creating platform-specific scrapers.
 *
 * This file should only be imported in server components or API routes.
 */

import { ScraperInterface } from './types';
import { ShopeeScraper } from './shopee-scraper';
import { LazadaScraper } from './lazada-scraper';
import { GoogleShoppingScraper } from './google-shopping-scraper';
import { EnhancedTemuScraper } from './enhanced-temu-scraper';
import { EnhancedMultiScraper } from './enhanced-multi-scraper';
import { TemuCloudScraper } from './temu-cloud-scraper';
import { ShopeeCloudScraper } from './shopee-cloud-scraper';

/**
 * Gets a scraper for the specified platform.
 *
 * @param platform The platform name (e.g., 'shopee', 'lazada').
 * @returns A scraper instance for the specified platform.
 * @throws {Error} If the platform is not supported.
 */
export function getScraperForPlatform(platform: string): ScraperInterface {
  // Get debug mode from environment variable
  const debug = process.env.NEXT_PUBLIC_DEBUG_SCRAPERS === 'true';

  switch (platform.toLowerCase()) {
    case 'temu':
      // Use our new CloudScraper implementation for Temu
      console.log('[ScraperFactory] Using TemuCloudScraper for Temu');
      return new TemuCloudScraper({ debug });
    case 'shopee':
      // Use our new CloudScraper implementation for Shopee
      console.log('[ScraperFactory] Using ShopeeCloudScraper for Shopee');
      return new ShopeeCloudScraper({ debug });
    case 'lazada':
      // Keep using the existing Lazada scraper since it works well
      return new LazadaScraper();
    // Add more platforms as they are implemented
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

/**
 * Gets scrapers for all supported platforms.
 *
 * @returns An array of scraper instances for all supported platforms.
 */
export function getAllScrapers(): ScraperInterface[] {
  // Get debug mode from environment variable
  const debug = process.env.NEXT_PUBLIC_DEBUG_SCRAPERS === 'true';

  return [
    new TemuCloudScraper({ debug }),
    new ShopeeCloudScraper({ debug }),
    new LazadaScraper(),
    // Add more platforms as they are implemented
  ];
}

/**
 * Gets the names of all supported platforms.
 *
 * @returns An array of platform names.
 */
export function getSupportedPlatforms(): string[] {
  return [
    'Temu',
    'Shopee',
    'Lazada',
    // Add more platforms as they are implemented
  ];
}
