/**
 * Simple Shopee scraper implementation using Playwright.
 * This is a simplified version for testing purposes.
 */

import { Product } from './types';
import { SearchFilters } from '../shopping-apis';
import * as playwright from 'playwright';

/**
 * Simple scraper for Shopee e-commerce platform.
 */
export class SimpleShopeeScraperForTesting {
  /**
   * Searches for products on Shopee.
   *
   * @param query The search query.
   * @param filters Optional filters to apply to the search.
   * @returns A promise that resolves to an array of Product objects.
   */
  async searchProducts(query: string, filters?: SearchFilters): Promise<Product[]> {
    console.log(`[SimpleShopeeScraperForTesting] Searching for: "${query}"`);
    
    const browser = await playwright.chromium.launch({ headless: true });
    
    try {
      const page = await browser.newPage();
      
      // Set user agent to avoid detection
      await page.setExtraHTTPHeaders({
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      });
      
      // Navigate to Shopee search page
      const searchUrl = `https://shopee.ph/search?keyword=${encodeURIComponent(query)}`;
      console.log(`[SimpleShopeeScraperForTesting] Navigating to: ${searchUrl}`);
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      // Wait for search results to load
      console.log(`[SimpleShopeeScraperForTesting] Waiting for search results...`);
      
      // Take a screenshot for debugging
      await page.screenshot({ path: 'shopee-search-debug.png' });
      console.log(`[SimpleShopeeScraperForTesting] Screenshot saved to shopee-search-debug.png for debugging`);
      
      // Wait for a bit to let the page load
      await page.waitForTimeout(5000);
      
      // Try to close any popups
      try {
        const closeButtons = await page.$$('button[class*="close"], [class*="close-btn"], [aria-label="Close"]');
        for (const button of closeButtons) {
          await button.click().catch(() => {});
        }
      } catch (error) {
        console.log('[SimpleShopeeScraperForTesting] Error closing popups:', error);
      }
      
      // Try to extract products using Shopee's API directly
      console.log('[SimpleShopeeScraperForTesting] Trying to use Shopee API directly');
      
      try {
        // Shopee API endpoint for search
        const apiUrl = `https://shopee.ph/api/v4/search/search_items?by=relevancy&keyword=${encodeURIComponent(query)}&limit=60&newest=0&order=desc&page_type=search&scenario=PAGE_GLOBAL_SEARCH&version=2`;
        
        // Make the API request
        const apiResponse = await page.evaluate(async (url) => {
          try {
            const response = await fetch(url, {
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
                'Accept': 'application/json',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://shopee.ph/search',
                'X-Requested-With': 'XMLHttpRequest'
              }
            });
            return await response.json();
          } catch (e) {
            console.error('Error fetching from API:', e);
            return null;
          }
        }, apiUrl);
        
        console.log('[SimpleShopeeScraperForTesting] API response received, processing...');
        
        if (apiResponse && apiResponse.items && Array.isArray(apiResponse.items)) {
          const apiProducts = apiResponse.items
            .filter((item: any) => item && item.item_basic)
            .map((item: any) => {
              const itemData = item.item_basic;
              return {
                id: `${itemData.shopid}_${itemData.itemid}`,
                title: itemData.name,
                price: itemData.price / 100000, // Shopee prices are in smallest currency unit
                productUrl: `https://shopee.ph/product/${itemData.shopid}/${itemData.itemid}`,
                platform: 'Shopee',
                imageUrl: `https://cf.shopee.ph/file/${itemData.image}`,
                originalPrice: itemData.price_before_discount ? itemData.price_before_discount / 100000 : undefined,
                discountPercentage: itemData.discount,
                rating: itemData.item_rating?.rating_star,
                ratingCount: itemData.item_rating?.rating_count?.[0],
                location: itemData.shop_location,
                sales: itemData.historical_sold,
                source: 'simple-shopee-scraper'
              };
            });
          
          console.log(`[SimpleShopeeScraperForTesting] Extracted ${apiProducts.length} products from API`);
          
          if (apiProducts.length > 0) {
            return apiProducts;
          }
        }
      } catch (error) {
        console.error('[SimpleShopeeScraperForTesting] Error using Shopee API:', error);
      }
      
      // If API approach failed, try to extract from the page
      console.log('[SimpleShopeeScraperForTesting] API approach failed, trying to extract from page');
      
      // Take another screenshot after trying to close popups
      await page.screenshot({ path: 'shopee-search-after-popups.png' });
      
      // Extract product data from the page
      const products = await page.evaluate(() => {
        const items = Array.from(document.querySelectorAll('[data-sqe="item"]'));
        console.log(`Found ${items.length} items on page`);
        
        return items.map(item => {
          // Extract product details
          const titleElement = item.querySelector('[data-sqe="name"]');
          const priceElement = item.querySelector('[data-sqe="price"]');
          const linkElement = item.querySelector('a');
          const imageElement = item.querySelector('img');
          
          // Extract product ID from URL
          let productId = '';
          if (linkElement && linkElement.getAttribute('href')) {
            const href = linkElement.getAttribute('href') || '';
            const match = href.match(/\/product\/(\d+)\/(\d+)/);
            if (match && match.length >= 3) {
              productId = `${match[1]}_${match[2]}`;
            }
          }
          
          // Extract price
          let price = 0;
          if (priceElement) {
            const priceText = priceElement.textContent || '';
            // Remove currency symbol and commas, then parse as float
            price = parseFloat(priceText.replace(/[^\d.]/g, ''));
          }
          
          return {
            id: productId || `shopee_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
            title: titleElement ? titleElement.textContent || 'Unknown Product' : 'Unknown Product',
            price: price,
            productUrl: linkElement ? linkElement.getAttribute('href') || '' : '',
            imageUrl: imageElement ? imageElement.getAttribute('src') || '' : '',
            platform: 'Shopee',
            source: 'simple-shopee-scraper'
          };
        }).filter(product => 
          product.title !== 'Unknown Product' && 
          product.price > 0 && 
          product.productUrl
        );
      });
      
      console.log(`[SimpleShopeeScraperForTesting] Extracted ${products.length} products from page`);
      
      return products;
    } catch (error) {
      console.error(`[SimpleShopeeScraperForTesting] Error:`, error);
      return [];
    } finally {
      await browser.close();
      console.log(`[SimpleShopeeScraperForTesting] Browser closed`);
    }
  }
}
