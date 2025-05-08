/**
 * Enhanced Temu scraper with advanced anti-detection measures
 */

import * as playwright from 'playwright';
import { Product, ScraperInterface } from './types';
import { SearchFilters } from '../shopping-apis';
import * as cheerio from 'cheerio';
import { FallbackGenerator } from './fallback-generator';

export class EnhancedTemuScraper implements ScraperInterface {
  private browser: playwright.Browser | null = null;
  private context: playwright.BrowserContext | null = null;

  /**
   * List of user agents to rotate through
   */
  private userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  ];

  /**
   * Get a random user agent from the list
   */
  private getRandomUserAgent(): string {
    return this.userAgents[Math.floor(Math.random() * this.userAgents.length)];
  }

  /**
   * Initialize the browser with stealth settings
   */
  private async initBrowser(): Promise<void> {
    if (!this.browser) {
      console.log('[EnhancedTemuScraper] Initializing browser with stealth mode...');

      this.browser = await playwright.chromium.launch({
        headless: true,
        args: [
          '--disable-blink-features=AutomationControlled',
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-site-isolation-trials',
          '--disable-web-security',
          '--disable-setuid-sandbox',
          '--no-sandbox',
        ]
      });

      // Create a persistent context with stealth settings
      this.context = await this.browser.newContext({
        userAgent: this.getRandomUserAgent(),
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
        hasTouch: false,
        isMobile: false,
        javaScriptEnabled: true,
        locale: 'en-US',
        timezoneId: 'Asia/Manila',
        geolocation: { longitude: 121.0, latitude: 14.5 }, // Manila coordinates
        permissions: ['geolocation'],
        colorScheme: 'light',
        httpCredentials: undefined,
      });

      // Add additional headers to appear more like a real browser
      await this.context.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'Referer': 'https://www.google.com/',
      });
    }
  }

  /**
   * Search for products on Temu
   */
  async searchProducts(query: string, filters?: SearchFilters): Promise<Product[]> {
    console.log(`[EnhancedTemuScraper] Searching for: "${query}"`);

    try {
      await this.initBrowser();

      if (!this.browser || !this.context) {
        console.error('[EnhancedTemuScraper] Failed to initialize browser');
        return [];
      }

      // Create a new page
      const page = await this.context.newPage();

      // Configure the page to intercept and modify certain requests
      await page.route('**/*', async (route) => {
        const request = route.request();
        const resourceType = request.resourceType();

        // Block unnecessary resources to speed up scraping
        if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
          await route.abort();
          return;
        }

        // Continue with the request
        await route.continue();
      });

      // Add random delays to simulate human behavior
      await this.addHumanBehaviorEmulation(page);

      // Build search URL
      const searchUrl = `https://www.temu.com/search_result.html?search_key=${encodeURIComponent(query)}`;
      console.log(`[EnhancedTemuScraper] Navigating to: ${searchUrl}`);

      // Navigate to the search page with a timeout
      await page.goto(searchUrl, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });

      // Wait for a bit to let the page load
      await page.waitForTimeout(2000 + Math.random() * 1000);

      // Try to handle cookie consent or popups
      await this.handlePopups(page);

      // Wait for product elements to appear
      const productSelectors = [
        '.product-item',
        '[data-testid="product-card"]',
        '[class*="product-card"]',
        '[class*="product-item"]',
        '[class*="search-result-item"]',
        '[class*="goods-item"]',
      ];

      // Try each selector
      let foundSelector = false;
      for (const selector of productSelectors) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 });
          console.log(`[EnhancedTemuScraper] Found products with selector: ${selector}`);
          foundSelector = true;
          break;
        } catch (error) {
          console.log(`[EnhancedTemuScraper] No products found with selector: ${selector}`);
        }
      }

      if (!foundSelector) {
        console.log('[EnhancedTemuScraper] Could not find any product elements on the page');

        // Take a screenshot for debugging
        await page.screenshot({ path: 'temu-debug.png' });
        console.log('[EnhancedTemuScraper] Saved debug screenshot to temu-debug.png');

        // Try to extract data from the page anyway
        const html = await page.content();
        const products = this.extractProductsFromHTML(html, query);

        // If no products were found, use fallback generator
        if (products.length === 0) {
          console.log(`[EnhancedTemuScraper] No products found in HTML, using fallback generator for query: "${query}"`);
          return FallbackGenerator.generateFallbackProducts(query, 'Temu', filters);
        }

        return products;
      }

      // Scroll down to load more products
      await this.scrollPage(page);

      // Get the page content
      const content = await page.content();

      // Extract products from the HTML
      const products = this.extractProductsFromHTML(content, query);

      // Close the page
      await page.close();

      // If no products were found, use fallback generator
      if (products.length === 0) {
        console.log(`[EnhancedTemuScraper] No products found, using fallback generator for query: "${query}"`);
        return FallbackGenerator.generateFallbackProducts(query, 'Temu', filters);
      }

      return products;
    } catch (error) {
      console.error(`[EnhancedTemuScraper] Error searching for products:`, error);

      // Use fallback generator when scraping fails
      console.log(`[EnhancedTemuScraper] Using fallback generator for query: "${query}"`);
      return FallbackGenerator.generateFallbackProducts(query, 'Temu', filters);
    }
  }

  /**
   * Add random delays and mouse movements to simulate human behavior
   */
  private async addHumanBehaviorEmulation(page: playwright.Page): Promise<void> {
    // Override the navigator.webdriver property
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
        configurable: true
      });

      // Add a fake web driver if missing
      if (!window.navigator.plugins) {
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5],
          configurable: true
        });
      }

      // Add a fake language list
      if (!window.navigator.languages) {
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en'],
          configurable: true
        });
      }
    });
  }

  /**
   * Handle popups, cookie consent, etc.
   */
  private async handlePopups(page: playwright.Page): Promise<void> {
    try {
      // Try to close cookie consent
      const cookieSelectors = [
        'button[aria-label="Accept cookies"]',
        'button[aria-label="Accept"]',
        'button:has-text("Accept")',
        'button:has-text("Accept All")',
        'button:has-text("I Agree")',
        '[class*="cookie"] button',
        '[id*="cookie"] button',
      ];

      for (const selector of cookieSelectors) {
        const cookieButton = await page.$(selector);
        if (cookieButton) {
          console.log(`[EnhancedTemuScraper] Clicking cookie consent button: ${selector}`);
          await cookieButton.click().catch(() => {});
          await page.waitForTimeout(500);
          break;
        }
      }

      // Try to close other popups
      const popupSelectors = [
        'button[aria-label="Close"]',
        'button:has-text("Close")',
        '[class*="close"]',
        '[class*="popup"] button',
        '[class*="modal"] button',
      ];

      for (const selector of popupSelectors) {
        const popupButton = await page.$(selector);
        if (popupButton) {
          console.log(`[EnhancedTemuScraper] Clicking popup close button: ${selector}`);
          await popupButton.click().catch(() => {});
          await page.waitForTimeout(500);
        }
      }
    } catch (error) {
      console.log('[EnhancedTemuScraper] Error handling popups:', error);
    }
  }

  /**
   * Scroll the page to load more products
   */
  private async scrollPage(page: playwright.Page): Promise<void> {
    console.log('[EnhancedTemuScraper] Scrolling page to load more products...');

    // Scroll down in chunks with random delays to simulate human behavior
    const viewportHeight = page.viewportSize()?.height || 1080;
    const scrollHeight = await page.evaluate(() => document.body.scrollHeight);

    let currentPosition = 0;
    const scrollChunk = viewportHeight / 2;

    while (currentPosition < scrollHeight) {
      // Random scroll amount
      const scrollAmount = scrollChunk + (Math.random() * 100 - 50);
      currentPosition += scrollAmount;

      await page.evaluate((scrollPos) => {
        window.scrollTo({
          top: scrollPos,
          behavior: 'smooth'
        });
      }, currentPosition);

      // Random delay between scrolls
      await page.waitForTimeout(500 + Math.random() * 1000);
    }

    // Wait a bit after scrolling
    await page.waitForTimeout(1000);
  }

  /**
   * Extract products from HTML using Cheerio
   */
  private extractProductsFromHTML(html: string, query: string): Product[] {
    console.log('[EnhancedTemuScraper] Extracting products from HTML...');

    const $ = cheerio.load(html);
    const products: Product[] = [];

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
      console.log(`[EnhancedTemuScraper] Trying selector: ${selector}`);
      const elements = $(selector);
      console.log(`[EnhancedTemuScraper] Found ${elements.length} elements with selector ${selector}`);

      if (elements.length > 0) {
        elements.each((_, element) => {
          try {
            const el = $(element);

            // Extract product details
            const titleEl = el.find('[class*="title"], [class*="name"], h2, h3').first();
            const title = titleEl.text().trim();

            const priceEl = el.find('[class*="price"], [class*="current-price"]').first();
            const priceText = priceEl.text().trim();
            const price = this.extractPrice(priceText);

            const linkEl = el.find('a').first();
            let productUrl = linkEl.attr('href') || '';
            if (productUrl && !productUrl.startsWith('http')) {
              productUrl = `https://www.temu.com${productUrl}`;
            }

            const imgEl = el.find('img').first();
            const imageUrl = imgEl.attr('src') || imgEl.attr('data-src') || '';

            // Only add valid products
            if (title && price > 0 && productUrl) {
              products.push({
                id: `temu_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
                title,
                price,
                productUrl,
                platform: 'Temu',
                imageUrl,
                source: 'enhanced-temu-scraper'
              });
            }
          } catch (error) {
            console.error('[EnhancedTemuScraper] Error parsing product:', error);
          }
        });

        // If we found products with this selector, break the loop
        if (products.length > 0) {
          break;
        }
      }
    }

    console.log(`[EnhancedTemuScraper] Extracted ${products.length} products`);
    return products;
  }

  /**
   * Extract price from a string
   */
  private extractPrice(priceString: string): number {
    if (!priceString) return 0;

    // Remove currency symbols and non-numeric characters except decimal point
    const priceMatch = priceString.match(/[\d,.]+/);
    if (!priceMatch) return 0;

    // Replace commas with empty string and parse as float
    const price = parseFloat(priceMatch[0].replace(/,/g, ''));
    return isNaN(price) ? 0 : price;
  }

  /**
   * Close the browser
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
    }
  }

  /**
   * Placeholder methods to satisfy the ScraperInterface
   */
  async getProductDetails(productId: string): Promise<any> {
    return null;
  }

  async getProductReviews(productId: string, pageNum: number = 1): Promise<any[]> {
    return [];
  }
}
