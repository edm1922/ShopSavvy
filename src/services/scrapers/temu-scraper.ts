/**
 * Temu scraper implementation using Playwright.
 */

import * as cheerio from 'cheerio';
import { Product, ProductDetails, ProductReview, ScraperInterface } from './types';
import { SearchFilters } from '../shopping-apis';
import { Browser, Page, launchBrowser, createMockBrowser } from './playwright-loader';

/**
 * Scraper for Temu e-commerce platform using Playwright for browser automation.
 */
export class TemuScraper implements ScraperInterface {
  private browser: Browser | null = null;
  private readonly baseUrl = 'https://www.temu.com';
  private readonly searchUrl = '/search_result.html';
  private readonly userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15',
  ];

  /**
   * Creates a new Temu scraper.
   */
  constructor() {
    // Browser will be initialized on first use
  }

  /**
   * Gets a random user agent from the list.
   *
   * @returns A random user agent string.
   */
  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  /**
   * Initializes the browser if it's not already initialized.
   *
   * @returns A promise that resolves to a Playwright browser instance.
   */
  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      console.log('[TemuScraper] Initializing browser...');

      // Check if we're in a browser environment
      const isBrowser = typeof window !== 'undefined';

      if (isBrowser) {
        // In the browser, use a mock browser
        console.log('[TemuScraper] Using mock browser in browser environment');
        this.browser = createMockBrowser();
      } else {
        // On the server, use a real browser
        const browser = await launchBrowser({
          headless: true, // Run in headless mode
        });

        if (browser) {
          this.browser = browser;
        } else {
          // If browser launch fails, use a mock browser
          console.warn('[TemuScraper] Failed to launch browser, using mock browser');
          this.browser = createMockBrowser();
        }
      }
    }
    return this.browser;
  }

  /**
   * Creates a new page with stealth settings to avoid detection.
   *
   * @returns A promise that resolves to a Playwright page.
   */
  private async createStealthPage(): Promise<Page> {
    const browser = await this.getBrowser();
    const context = await browser.newContext({
      userAgent: this.getRandomUserAgent(),
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
      hasTouch: false,
      isMobile: false,
      javaScriptEnabled: true,
    });

    // Add additional headers to appear more like a real browser
    await context.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1',
    });

    const page = await context.newPage();

    // Intercept and block unnecessary resources to speed up scraping
    await page.route('**/*.{png,jpg,jpeg,gif,svg,css,woff,woff2,ttf,otf}', route => {
      route.abort();
    });

    return page;
  }

  /**
   * Searches for products on Temu using Playwright.
   *
   * @param query The search query.
   * @param filters Optional filters to apply to the search.
   * @returns A promise that resolves to an array of Product objects.
   */
  async searchProducts(query: string, filters?: SearchFilters): Promise<Product[]> {
    let page: Page | null = null;

    try {
      console.log(`[TemuScraper] Searching for: ${query}`, filters);

      // Check if we're in a browser environment
      if (typeof window !== 'undefined') {
        console.log('[TemuScraper] Running in browser environment, returning empty results');
        return [];
      }

      // Build the search URL with query parameters
      let searchQueryUrl = `${this.baseUrl}${this.searchUrl}?q=${encodeURIComponent(query)}`;

      // Add filters if provided
      if (filters) {
        if (filters.minPrice && filters.maxPrice) {
          searchQueryUrl += `&price_min=${filters.minPrice}&price_max=${filters.maxPrice}`;
        } else if (filters.minPrice) {
          searchQueryUrl += `&price_min=${filters.minPrice}`;
        } else if (filters.maxPrice) {
          searchQueryUrl += `&price_max=${filters.maxPrice}`;
        }
      }

      console.log(`[TemuScraper] Navigating to: ${searchQueryUrl}`);

      // Create a new page
      page = await this.createStealthPage();

      // Navigate to the search page
      await page.goto(searchQueryUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // Wait for the page to load
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
        console.log('[TemuScraper] Timeout waiting for network idle, continuing anyway');
      });

      // Wait for product elements to appear
      await page.waitForSelector('.product-item, [data-testid="product-card"], [class*="product-card"]', { timeout: 5000 }).catch(() => {
        console.log('[TemuScraper] No product cards found with expected selectors');
      });

      // Take a screenshot for debugging
      await page.screenshot({ path: 'temu-search-debug.png' });
      console.log('[TemuScraper] Screenshot saved to temu-search-debug.png for debugging');

      // Extract product data from the page
      const products = await this.extractProductsFromPage(page, query);

      console.log(`[TemuScraper] Found ${products.length} products`);

      return products;
    } catch (error) {
      console.error('Error searching Temu products:', error);
      return [];
    } finally {
      // Close the page to free resources
      if (page) {
        await page.close().catch(() => {});
      }
    }
  }

  /**
   * Extracts product data from a Playwright page.
   *
   * @param page The Playwright page.
   * @param query The search query (used for fallback).
   * @returns A promise that resolves to an array of Product objects.
   */
  private async extractProductsFromPage(page: Page, query: string): Promise<Product[]> {
    try {
      // Get the HTML content
      const content = await page.content();

      // Use cheerio to parse the HTML
      const $ = cheerio.load(content);
      const extractedProducts: Product[] = [];

      // Try different selectors for product cards
      const selectors = [
        '.product-item',
        '[data-testid="product-card"]',
        '[class*="product-card"]',
        '[class*="product-item"]',
        '[class*="search-result-item"]',
        '[class*="goods-item"]',
      ];

      for (const selector of selectors) {
        console.log(`[TemuScraper] Trying selector: ${selector}`);
        const elements = $(selector);
        console.log(`[TemuScraper] Found ${elements.length} elements with selector ${selector}`);

        if (elements.length > 0) {
          elements.each((_, element) => {
            try {
              const el = $(element);

              // Extract the product URL
              const linkElement = el.find('a').first();
              const productUrl = linkElement.attr('href') || '';
              const fullProductUrl = productUrl.startsWith('http') ? productUrl : `${this.baseUrl}${productUrl}`;

              // Extract product ID from URL or data attribute
              const productId = el.attr('data-id') || el.attr('data-product-id') || `temu_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

              // Extract title
              const titleElement = el.find('[class*="title"], [class*="name"], h2, h3').first();
              const title = titleElement.text().trim();

              // Extract price
              const priceElement = el.find('[class*="price"], [class*="current-price"]').first();
              const priceText = priceElement.text().trim();
              const price = this.extractPrice(priceText);

              // Extract image URL
              const imgElement = el.find('img').first();
              const imageUrl = imgElement.attr('src') || imgElement.attr('data-src') || '';

              // Extract rating if available
              const ratingElement = el.find('[class*="rating"], [class*="stars"]').first();
              const ratingText = ratingElement.text().trim();
              const rating = ratingText ? parseFloat(ratingText) : undefined;

              // Extract sales count if available
              const salesElement = el.find('[class*="sold"], [class*="sales"]').first();
              const salesText = salesElement.text().trim();
              const sales = salesText ? parseInt(salesText.replace(/[^0-9]/g, '')) : undefined;

              if (title && price > 0) {
                const product: Product = {
                  id: productId,
                  title,
                  price,
                  productUrl: fullProductUrl,
                  platform: 'Temu',
                  imageUrl,
                  rating,
                  sales,
                  source: 'temu-scraper'
                };

                extractedProducts.push(product);
              }
            } catch (error) {
              console.error('Error parsing Temu product:', error);
            }
          });

          // If we found products with this selector, break the loop
          if (extractedProducts.length > 0) {
            console.log(`[TemuScraper] Successfully parsed ${extractedProducts.length} products with selector ${selector}`);
            break;
          }
        }
      }

      return extractedProducts;
    } catch (error) {
      console.error('Error extracting products from page:', error);
      return [];
    }
  }

  /**
   * Extracts the price from a price string.
   *
   * @param priceString The price string.
   * @returns The price as a number.
   */
  private extractPrice(priceString: string): number {
    if (!priceString) return 0;
    // Remove currency symbols and non-numeric characters except for decimal point
    const price = parseFloat(priceString.replace(/[^\d.]/g, ''));
    return isNaN(price) ? 0 : price;
  }

  /**
   * Gets detailed information about a specific product.
   * This is a placeholder implementation.
   */
  async getProductDetails(productId: string): Promise<ProductDetails | null> {
    // Not implemented for this example
    return null;
  }

  /**
   * Gets reviews for a specific product.
   * This is a placeholder implementation.
   */
  async getProductReviews(productId: string, pageNum: number = 1): Promise<ProductReview[]> {
    // Not implemented for this example
    return [];
  }

  /**
   * Closes the browser when the scraper is no longer needed.
   */
  async close(): Promise<void> {
    if (this.browser) {
      console.log('[TemuScraper] Closing browser...');
      await this.browser.close();
      this.browser = null;
    }
  }
}
