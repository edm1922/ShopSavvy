/**
 * Enhanced multi-platform scraper that adapts concepts from Scrapper_v18
 * Supports multiple platforms with flexible selectors and fallback mechanisms
 */

import * as playwright from 'playwright';
import { Product, ScraperInterface } from './types';
import { SearchFilters } from '../shopping-apis';
import * as cheerio from 'cheerio';
import { FallbackGenerator } from './fallback-generator';

// Type for platform-specific selector configurations
interface SelectorConfig {
  productContainer: string[];
  productName: string[];
  productPrice: string[];
  productImage: string[];
  productUrl: string[];
  productRating: string[];
  pagination: string[];
}

// Selector configurations for different platforms
const PLATFORM_SELECTORS: Record<string, SelectorConfig> = {
  temu: {
    productContainer: [
      '.product-item',
      '[data-testid="product-card"]',
      '[class*="product-card"]',
      '[class*="product-item"]',
      '[class*="search-result-item"]',
      '[class*="goods-item"]'
    ],
    productName: [
      '[class*="title"]',
      '[class*="name"]',
      'h2',
      'h3',
      '.product-title',
      '.item-name'
    ],
    productPrice: [
      '[class*="price"]',
      '[class*="current-price"]',
      '.product-price',
      '.item-price'
    ],
    productImage: [
      'img',
      '[class*="image"] img',
      '.product-image img'
    ],
    productUrl: [
      'a',
      '[class*="product-link"]',
      '[class*="item-link"]'
    ],
    productRating: [
      '[class*="rating"]',
      '[class*="stars"]',
      '.product-rating'
    ],
    pagination: [
      '[class*="pagination"] a',
      'a[href*="page="]',
      '[class*="page-number"]'
    ]
  },
  shopee: {
    productContainer: [
      '[data-sqe="item"]',
      '.shopee-search-item-result__item',
      '[class*="search-item"]',
      '[class*="product-item"]'
    ],
    productName: [
      '[data-sqe="name"]',
      '.shopee-item-card__text-name',
      '[class*="product-name"]',
      '[class*="item-name"]'
    ],
    productPrice: [
      '[data-sqe="price"]',
      '.shopee-item-card__current-price',
      '[class*="price"]'
    ],
    productImage: [
      '.shopee-search-item-result__item img',
      '[class*="product-image"] img',
      'img'
    ],
    productUrl: [
      'a',
      '[class*="product-link"]'
    ],
    productRating: [
      '[class*="rating"]',
      '[data-sqe="rating"]'
    ],
    pagination: [
      '.shopee-page-controller',
      '[class*="pagination"] button',
      'button[class*="page"]'
    ]
  }
};

/**
 * Enhanced multi-platform scraper that can handle different e-commerce sites
 */
export class EnhancedMultiScraper implements ScraperInterface {
  private browser: playwright.Browser | null = null;
  private readonly platform: string;
  private readonly selectors: SelectorConfig;
  private readonly baseUrl: string;

  /**
   * Creates a new enhanced multi-platform scraper
   *
   * @param platform The platform to scrape (e.g., 'temu', 'shopee')
   */
  constructor(platform: string) {
    this.platform = platform.toLowerCase();

    // Get selectors for the platform or use default
    this.selectors = PLATFORM_SELECTORS[this.platform] || PLATFORM_SELECTORS.temu;

    // Set base URL based on platform
    switch (this.platform) {
      case 'temu':
        this.baseUrl = 'https://www.temu.com';
        break;
      case 'shopee':
        this.baseUrl = 'https://shopee.ph';
        break;
      default:
        this.baseUrl = 'https://www.temu.com';
    }

    console.log(`[EnhancedMultiScraper] Initialized for platform: ${this.platform}`);
  }

  /**
   * Searches for products on the platform
   *
   * @param query The search query
   * @param filters Optional filters to apply
   * @returns A promise that resolves to an array of products
   */
  async searchProducts(query: string, filters?: SearchFilters): Promise<Product[]> {
    console.log(`[EnhancedMultiScraper] Searching for "${query}" on ${this.platform}`);

    try {
      // Initialize browser
      this.browser = await playwright.chromium.launch({
        headless: true,
        args: [
          '--disable-blink-features=AutomationControlled',
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-site-isolation-trials',
        ]
      });

      // Create a new context with stealth settings
      const context = await this.browser.newContext({
        userAgent: this.getRandomUserAgent(),
        viewport: { width: 1920, height: 1080 },
        deviceScaleFactor: 1,
        hasTouch: false,
        isMobile: false,
        javaScriptEnabled: true,
      });

      // Add extra headers to appear more like a real browser
      await context.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'Referer': 'https://www.google.com/',
      });

      // Create a new page
      const page = await context.newPage();

      // Build search URL based on platform
      const searchUrl = this.buildSearchUrl(query);
      console.log(`[EnhancedMultiScraper] Navigating to: ${searchUrl}`);

      // Navigate to the search page
      const response = await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // Check for Cloudflare or other anti-bot protection
      await this.checkForAntiBot(page, response);

      // Wait for a random amount of time to simulate human behavior
      await this.randomDelay();

      // Handle any popups or cookie consent dialogs
      await this.handlePopups(page);

      // Try to detect pagination
      const maxPages = await this.detectMaxPages(page);
      console.log(`[EnhancedMultiScraper] Detected ${maxPages} pages of results`);

      // Limit to just the first page for testing
      const pagesToScrape = 1; // Math.min(maxPages, 2);

      let allProducts: Product[] = [];

      // Scrape the first page
      const firstPageProducts = await this.extractProductsFromPage(page, query);
      allProducts = [...allProducts, ...firstPageProducts];

      // If no products found on first page, use fallback
      if (allProducts.length === 0) {
        console.log(`[EnhancedMultiScraper] No products found on first page, using fallback`);
        await page.close();
        await context.close();
        await this.browser.close();
        this.browser = null;

        return FallbackGenerator.generateFallbackProducts(query, this.platform, filters);
      }

      // Scrape additional pages if needed
      for (let pageNum = 2; pageNum <= pagesToScrape; pageNum++) {
        const pageUrl = this.buildPageUrl(searchUrl, pageNum);
        console.log(`[EnhancedMultiScraper] Navigating to page ${pageNum}: ${pageUrl}`);

        await page.goto(pageUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await this.randomDelay();

        const pageProducts = await this.extractProductsFromPage(page, query);
        allProducts = [...allProducts, ...pageProducts];
      }

      // Close browser
      await page.close();
      await context.close();
      await this.browser.close();
      this.browser = null;

      console.log(`[EnhancedMultiScraper] Found ${allProducts.length} products for "${query}" on ${this.platform}`);
      return allProducts;
    } catch (error) {
      console.error(`[EnhancedMultiScraper] Error searching for "${query}" on ${this.platform}:`, error);

      // Clean up browser if still open
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }

      // Use fallback generator when scraping fails
      return FallbackGenerator.generateFallbackProducts(query, this.platform, filters);
    }
  }

  /**
   * Builds a search URL for the platform
   *
   * @param query The search query
   * @returns The search URL
   */
  private buildSearchUrl(query: string): string {
    const encodedQuery = encodeURIComponent(query);

    switch (this.platform) {
      case 'temu':
        return `${this.baseUrl}/search_result.html?search_key=${encodedQuery}`;
      case 'shopee':
        return `${this.baseUrl}/search?keyword=${encodedQuery}`;
      default:
        return `${this.baseUrl}/search?q=${encodedQuery}`;
    }
  }

  /**
   * Builds a URL for a specific page of search results
   *
   * @param baseUrl The base search URL
   * @param pageNum The page number
   * @returns The URL for the specified page
   */
  private buildPageUrl(baseUrl: string, pageNum: number): string {
    const url = new URL(baseUrl);

    // Different platforms use different pagination parameters
    if (this.platform === 'shopee') {
      url.searchParams.set('page', pageNum.toString());
    } else {
      // Default for most platforms including Temu
      url.searchParams.set('page', pageNum.toString());
    }

    return url.toString();
  }

  /**
   * Extracts products from the current page
   *
   * @param page The Playwright page
   * @param query The search query (for fallback)
   * @returns A promise that resolves to an array of products
   */
  private async extractProductsFromPage(page: playwright.Page, query: string): Promise<Product[]> {
    // Get the HTML content of the page
    const content = await page.content();

    // Use cheerio to parse the HTML
    const $ = cheerio.load(content);
    const products: Product[] = [];

    // Try each product container selector
    for (const containerSelector of this.selectors.productContainer) {
      console.log(`[EnhancedMultiScraper] Trying selector: ${containerSelector}`);

      const productElements = $(containerSelector);
      console.log(`[EnhancedMultiScraper] Found ${productElements.length} elements with selector ${containerSelector}`);

      if (productElements.length > 0) {
        // Process each product element
        productElements.each((_, element) => {
          try {
            // Extract product details using flexible selectors
            const product = this.extractProductDetails($, element);

            // Only add valid products
            if (product.title && product.price > 0) {
              products.push(product);
            }
          } catch (error) {
            console.error(`[EnhancedMultiScraper] Error extracting product:`, error);
          }
        });

        // If we found products with this selector, break the loop
        if (products.length > 0) {
          break;
        }
      }
    }

    console.log(`[EnhancedMultiScraper] Extracted ${products.length} products from page`);
    return products;
  }

  /**
   * Extracts product details from a product element
   *
   * @param $ The cheerio instance
   * @param element The product element
   * @returns A product object
   */
  private extractProductDetails($: cheerio.CheerioAPI, element: cheerio.Element): Product {
    // Try each selector for product name
    let title = '';
    for (const selector of this.selectors.productName) {
      const nameElement = $(element).find(selector).first();
      if (nameElement.length > 0) {
        title = nameElement.text().trim();
        break;
      }
    }

    // Try each selector for product price
    let priceText = '';
    for (const selector of this.selectors.productPrice) {
      const priceElement = $(element).find(selector).first();
      if (priceElement.length > 0) {
        priceText = priceElement.text().trim();
        break;
      }
    }

    // Extract numeric price
    const price = this.extractPrice(priceText);

    // Try each selector for product image
    let imageUrl = '';
    for (const selector of this.selectors.productImage) {
      const imgElement = $(element).find(selector).first();
      if (imgElement.length > 0) {
        imageUrl = imgElement.attr('src') || imgElement.attr('data-src') || '';
        break;
      }
    }

    // Try each selector for product URL
    let productUrl = '';
    for (const selector of this.selectors.productUrl) {
      const linkElement = $(element).find(selector).first();
      if (linkElement.length > 0) {
        productUrl = linkElement.attr('href') || '';
        break;
      }
    }

    // Make sure URL is absolute
    if (productUrl && !productUrl.startsWith('http')) {
      productUrl = `${this.baseUrl}${productUrl.startsWith('/') ? '' : '/'}${productUrl}`;
    }

    // Try each selector for product rating
    let ratingText = '';
    for (const selector of this.selectors.productRating) {
      const ratingElement = $(element).find(selector).first();
      if (ratingElement.length > 0) {
        ratingText = ratingElement.text().trim();
        break;
      }
    }

    // Extract numeric rating
    const ratingMatch = ratingText.match(/(\d+(\.\d+)?)/);
    const rating = ratingMatch ? parseFloat(ratingMatch[1]) : undefined;

    return {
      id: `${this.platform}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
      title,
      price,
      productUrl,
      platform: this.platform.charAt(0).toUpperCase() + this.platform.slice(1),
      imageUrl,
      rating,
      source: `enhanced-multi-scraper-${this.platform}`
    };
  }

  /**
   * Extracts a numeric price from a price string
   *
   * @param priceString The price string
   * @returns The numeric price
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
   * Detects the maximum number of pages in the search results
   *
   * @param page The Playwright page
   * @returns A promise that resolves to the maximum number of pages
   */
  private async detectMaxPages(page: playwright.Page): Promise<number> {
    try {
      // Try each pagination selector
      for (const selector of this.selectors.pagination) {
        const paginationElements = await page.$$(selector);

        if (paginationElements.length > 0) {
          const pageNumbers: number[] = [];

          // Extract page numbers
          for (const element of paginationElements) {
            const text = await element.textContent();
            if (text && /^\d+$/.test(text.trim())) {
              pageNumbers.push(parseInt(text.trim(), 10));
            }
          }

          // Return the maximum page number, limited to 10
          if (pageNumbers.length > 0) {
            return Math.min(Math.max(...pageNumbers), 10);
          }
        }
      }

      // Default to 1 page if no pagination found
      return 1;
    } catch (error) {
      console.error(`[EnhancedMultiScraper] Error detecting pagination:`, error);
      return 1;
    }
  }

  /**
   * Handles popups and cookie consent dialogs
   *
   * @param page The Playwright page
   */
  private async handlePopups(page: playwright.Page): Promise<void> {
    try {
      // Common selectors for close buttons and cookie consent
      const closeSelectors = [
        'button[aria-label="Close"]',
        'button:has-text("Close")',
        '[class*="close"]',
        '[class*="popup"] button',
        '[class*="modal"] button',
        'button[aria-label="Accept cookies"]',
        'button[aria-label="Accept"]',
        'button:has-text("Accept")',
        'button:has-text("Accept All")',
        'button:has-text("I Agree")',
        '[class*="cookie"] button',
        '[id*="cookie"] button',
      ];

      // Try each selector
      for (const selector of closeSelectors) {
        const elements = await page.$$(selector);
        for (const element of elements) {
          try {
            await element.click();
            console.log(`[EnhancedMultiScraper] Clicked popup/cookie element: ${selector}`);
            await page.waitForTimeout(500);
          } catch (error) {
            // Ignore errors when clicking
          }
        }
      }
    } catch (error) {
      console.log(`[EnhancedMultiScraper] Error handling popups:`, error);
    }
  }

  /**
   * Waits for a random amount of time to simulate human behavior
   */
  private async randomDelay(): Promise<void> {
    const delay = 2000 + Math.random() * 2000; // 2-4 seconds
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  /**
   * Checks for Cloudflare or other anti-bot protection
   *
   * @param page The Playwright page
   * @param response The response from the page navigation
   */
  private async checkForAntiBot(page: playwright.Page, response: playwright.Response | null): Promise<void> {
    if (!response) {
      console.log(`[EnhancedMultiScraper] No response received for ${this.platform}`);
      return;
    }

    // Check response headers for Cloudflare
    const headers = response.headers();
    const server = headers['server'] || '';
    const cfRay = headers['cf-ray'] || '';
    const statusCode = response.status();

    console.log(`[EnhancedMultiScraper] Response status: ${statusCode}`);
    console.log(`[EnhancedMultiScraper] Server header: ${server}`);

    if (server.includes('cloudflare') || cfRay) {
      console.log(`[EnhancedMultiScraper] Cloudflare detected on ${this.platform}! CF-Ray: ${cfRay}`);
    }

    // Check for common challenge pages
    const content = await page.content();

    if (content.includes('cf-browser-verification') ||
        content.includes('cf_chl_') ||
        content.includes('_cf_chl') ||
        content.includes('cloudflare') ||
        content.includes('challenge-platform')) {
      console.log(`[EnhancedMultiScraper] Cloudflare challenge detected on ${this.platform}!`);

      // Take a screenshot for debugging
      await page.screenshot({ path: `${this.platform}-cloudflare-challenge.png` });
    }

    // Check for other common anti-bot systems
    if (content.includes('captcha') ||
        content.includes('robot') ||
        content.includes('security check') ||
        content.includes('verify you are human')) {
      console.log(`[EnhancedMultiScraper] CAPTCHA or security check detected on ${this.platform}!`);

      // Take a screenshot for debugging
      await page.screenshot({ path: `${this.platform}-captcha.png` });
    }

    // Check for page title that indicates blocking
    const title = await page.title();
    console.log(`[EnhancedMultiScraper] Page title: ${title}`);

    if (title.includes('Access Denied') ||
        title.includes('Security Check') ||
        title.includes('Attention Required') ||
        title.includes('CAPTCHA')) {
      console.log(`[EnhancedMultiScraper] Access blocked by title check on ${this.platform}: ${title}`);
    }
  }

  /**
   * Returns a random user agent
   */
  private getRandomUserAgent(): string {
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    ];
    return userAgents[Math.floor(Math.random() * userAgents.length)];
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

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}
