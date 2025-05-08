/**
 * Factory for creating platform-specific scrapers.
 *
 * This file provides a safe interface for both browser and server environments.
 * - In the browser, it uses mock implementations
 * - On the server, it uses real implementations
 */

import { ScraperInterface } from './types';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Import the browser-safe implementation directly
// This avoids any dynamic imports which can cause issues
import * as browserFactory from './scraper-factory-browser';

// For server-side, we'll use a conditional require
// This ensures the server-only code is never included in the client bundle
let serverFactory: any = null;

// Only attempt to load the server factory on the server
if (!isBrowser) {
  try {
    // Using require instead of import to ensure it's not included in the client bundle
    serverFactory = require('./scraper-factory-server');
  } catch (error) {
    console.error('Failed to load server-side scraper factory:', error);
    // Fallback to browser factory if server factory fails to load
    serverFactory = browserFactory;
  }
}

/**
 * Gets a scraper for the specified platform.
 *
 * @param platform The platform name (e.g., 'shopee', 'lazada').
 * @returns A scraper instance for the specified platform.
 * @throws {Error} If the platform is not supported.
 */
export function getScraperForPlatform(platform: string): ScraperInterface {
  // In the browser, always use the browser-safe implementation
  if (isBrowser) {
    return browserFactory.getScraperForPlatform(platform);
  }

  // On the server, use the server implementation if available
  if (serverFactory) {
    try {
      return serverFactory.getScraperForPlatform(platform);
    } catch (error) {
      console.error(`Error getting server scraper for platform ${platform}:`, error);
      // Fallback to browser implementation if server implementation fails
      return browserFactory.getScraperForPlatform(platform);
    }
  }

  // If server factory is not available, use browser implementation
  return browserFactory.getScraperForPlatform(platform);
}

/**
 * Gets scrapers for all supported platforms.
 *
 * @returns An array of scraper instances for all supported platforms.
 */
export function getAllScrapers(): ScraperInterface[] {
  // In the browser, always use the browser-safe implementation
  if (isBrowser) {
    return browserFactory.getAllScrapers();
  }

  // On the server, use the server implementation if available
  if (serverFactory) {
    try {
      return serverFactory.getAllScrapers();
    } catch (error) {
      console.error('Error getting server scrapers:', error);
      // Fallback to browser implementation if server implementation fails
      return browserFactory.getAllScrapers();
    }
  }

  // If server factory is not available, use browser implementation
  return browserFactory.getAllScrapers();
}

/**
 * Gets the names of all supported platforms.
 *
 * @returns An array of platform names.
 */
export function getSupportedPlatforms(): string[] {
  // This is the same for both browser and server
  return [
    // Philippine e-commerce platforms
    'Shopee',
    'Lazada',
    'Zalora',
    'BeautyMNL',
    'Galleon',
    'SHEIN',
    'Carousell',
    'Edamama',
    'Kimstore',
    'Abenson',
    'MetroMart',
    'Watsons',
    'SM Store',
    'Robinsons',
    'Landers',
    'S&R',
    'Puregold',
    'DataBlitz',
    'GameLine',
    'GameOne',
    'Toy Kingdom',
    'Toys R Us',
    'National Book Store',
    'Fully Booked',
    'Mercury Drug',
    'Southstar Drug',
    'Rose Pharmacy',
    'Generika',
    'CDR Skincare',

    // International e-commerce platforms
    'Amazon',
    'eBay',
    'Walmart',
    'Best Buy',
    'Target',
    'Newegg',
    'AliExpress',
    'Etsy',
    'Wish',
    'Temu',
    'JD.com',
    'Taobao',
    'Tmall',
    'Rakuten',
    'Flipkart',
    'Noon',
    'Jumia',
    'MercadoLibre',
    'Coupang',
    'Tokopedia',
    'Bukalapak',
    'Blibli',
    'Qoo10',
    'Gmarket',
    '11Street',
    'ShopClues',
    'Snapdeal',
    'Myntra',
    'Nykaa',
    'Paytm Mall',
    'JioMart',
    'BigBasket',
    'Grofers',
    'Lelong',
    'ShopBack',
  ];
}
