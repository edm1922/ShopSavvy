/**
 * CloudScraper - A TypeScript implementation inspired by the Python cloudscraper library
 * for bypassing Cloudflare's anti-bot protection.
 */

import * as playwright from 'playwright';
import { Product, ScraperInterface } from './types';
import { SearchFilters } from '../shopping-apis';
import * as cheerio from 'cheerio';

// User agent strings to rotate through
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15',
];

/**
 * CloudScraper class for bypassing Cloudflare protection
 */
export class CloudScraper {
  private browser: playwright.Browser | null = null;
  private context: playwright.BrowserContext | null = null;
  private cookies: any[] = [];
  private userAgent: string;
  private debug: boolean;
  
  /**
   * Create a new CloudScraper instance
   * 
   * @param options Configuration options
   */
  constructor(options: {
    debug?: boolean;
    userAgent?: string;
  } = {}) {
    this.debug = options.debug || false;
    this.userAgent = options.userAgent || this.getRandomUserAgent();
  }
  
  /**
   * Initialize the browser with stealth settings
   */
  private async initBrowser(): Promise<void> {
    if (this.browser) return;
    
    if (this.debug) console.log('[CloudScraper] Initializing browser with stealth mode...');
    
    // Launch browser with anti-detection arguments
    this.browser = await playwright.chromium.launch({
      headless: true,
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-site-isolation-trials',
        '--disable-web-security',
        '--no-sandbox',
      ]
    });
    
    // Create a persistent context with stealth settings
    this.context = await this.browser.newContext({
      userAgent: this.userAgent,
      viewport: { width: 1920, height: 1080 },
      deviceScaleFactor: 1,
      hasTouch: false,
      isMobile: false,
      javaScriptEnabled: true,
      locale: 'en-US',
      timezoneId: 'Asia/Manila',
      permissions: ['geolocation'],
      colorScheme: 'light',
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
    
    // Add JavaScript to evade detection
    await this.context.addInitScript(() => {
      // Override navigator properties
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      
      // Add language and plugins to appear more like a real browser
      if (!navigator.languages) {
        Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
      }
      
      // Override the permissions API
      if (navigator.permissions) {
        const originalQuery = navigator.permissions.query;
        navigator.permissions.query = (parameters: any) => {
          if (parameters.name === 'notifications') {
            return Promise.resolve({ state: "prompt" });
          }
          return originalQuery(parameters);
        };
      }
      
      // Add fake plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => {
          const plugins = [];
          for (let i = 0; i < 5; i++) {
            plugins.push({
              name: `Plugin ${i}`,
              description: `Fake plugin ${i}`,
              filename: `plugin${i}.dll`,
              length: 1,
              item: () => null
            });
          }
          return plugins;
        }
      });
    });
  }
  
  /**
   * Get a random user agent from the list
   */
  private getRandomUserAgent(): string {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  }
  
  /**
   * Make a GET request to a URL, bypassing Cloudflare protection
   * 
   * @param url The URL to request
   * @returns The HTML content of the page
   */
  async get(url: string): Promise<{
    content: string;
    cookies: any[];
    userAgent: string;
  }> {
    await this.initBrowser();
    
    if (!this.context) {
      throw new Error('Browser context not initialized');
    }
    
    if (this.debug) console.log(`[CloudScraper] Making GET request to: ${url}`);
    
    // Create a new page
    const page = await this.context.newPage();
    
    try {
      // Navigate to the URL
      const response = await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });
      
      if (!response) {
        throw new Error('No response received');
      }
      
      // Check for Cloudflare challenge
      await this.handleCloudflareChallenge(page, response);
      
      // Get the final content
      const content = await page.content();
      
      // Get cookies
      this.cookies = await this.context.cookies();
      
      if (this.debug) {
        console.log(`[CloudScraper] Request completed. Status: ${response.status()}`);
        console.log(`[CloudScraper] Cookies: ${JSON.stringify(this.cookies)}`);
      }
      
      return {
        content,
        cookies: this.cookies,
        userAgent: this.userAgent
      };
    } finally {
      await page.close();
    }
  }
  
  /**
   * Handle Cloudflare challenge pages
   * 
   * @param page The Playwright page
   * @param response The response from the page navigation
   */
  private async handleCloudflareChallenge(page: playwright.Page, response: playwright.Response): Promise<void> {
    const status = response.status();
    const url = response.url();
    
    // Check if we hit a Cloudflare challenge page
    const isCloudflareChallenge = 
      status === 403 || 
      status === 503 || 
      url.includes('cdn-cgi/challenge') ||
      url.includes('__cf_chl_captcha');
    
    if (!isCloudflareChallenge) {
      // No challenge detected
      return;
    }
    
    if (this.debug) console.log('[CloudScraper] Cloudflare challenge detected!');
    
    // Take a screenshot for debugging
    if (this.debug) {
      await page.screenshot({ path: 'cloudflare-challenge.png' });
      console.log('[CloudScraper] Screenshot saved to cloudflare-challenge.png');
    }
    
    // Wait for the challenge to be solved automatically
    // Cloudflare usually redirects after 5 seconds
    if (this.debug) console.log('[CloudScraper] Waiting for Cloudflare challenge to be solved...');
    
    // Wait for navigation or timeout after 10 seconds
    try {
      await page.waitForNavigation({ 
        timeout: 10000,
        waitUntil: 'domcontentloaded'
      });
      
      if (this.debug) console.log('[CloudScraper] Challenge appears to be solved!');
    } catch (error) {
      if (this.debug) console.log('[CloudScraper] Timeout waiting for challenge to be solved');
      
      // Check if we need to solve a CAPTCHA
      const hasCaptcha = await page.content().then(content => 
        content.includes('captcha') || 
        content.includes('cf-captcha-container')
      );
      
      if (hasCaptcha) {
        throw new Error('Cloudflare CAPTCHA detected. Manual solving required.');
      }
      
      // Try to click any visible buttons
      try {
        await page.click('button[type="submit"]');
        await page.waitForNavigation({ timeout: 5000 });
      } catch (clickError) {
        // Ignore click errors
      }
    }
  }
  
  /**
   * Close the browser and clean up resources
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
    }
  }
}

/**
 * CloudScraperAdapter - Adapts the CloudScraper to the ScraperInterface
 */
export class CloudScraperAdapter implements ScraperInterface {
  private cloudScraper: CloudScraper;
  private platform: string;
  private baseUrl: string;
  private debug: boolean;
  
  /**
   * Create a new CloudScraperAdapter
   * 
   * @param platform The platform to scrape (e.g., 'temu', 'shopee')
   * @param options Configuration options
   */
  constructor(platform: string, options: { debug?: boolean } = {}) {
    this.platform = platform.toLowerCase();
    this.debug = options.debug || false;
    this.cloudScraper = new CloudScraper({ debug: this.debug });
    
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
  }
  
  /**
   * Search for products on the platform
   * 
   * @param query The search query
   * @param filters Optional filters to apply
   * @returns A promise that resolves to an array of products
   */
  async searchProducts(query: string, filters?: SearchFilters): Promise<Product[]> {
    try {
      if (this.debug) console.log(`[CloudScraperAdapter] Searching for "${query}" on ${this.platform}`);
      
      // Build search URL based on platform
      const searchUrl = this.buildSearchUrl(query);
      
      // Get the page content
      const { content } = await this.cloudScraper.get(searchUrl);
      
      // Extract products from the HTML
      const products = this.extractProductsFromHTML(content, query);
      
      if (this.debug) console.log(`[CloudScraperAdapter] Found ${products.length} products`);
      
      return products;
    } catch (error) {
      console.error(`[CloudScraperAdapter] Error searching for "${query}" on ${this.platform}:`, error);
      return [];
    } finally {
      await this.cloudScraper.close();
    }
  }
  
  /**
   * Build a search URL for the platform
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
   * Extract products from HTML content
   * 
   * @param html The HTML content
   * @param query The search query
   * @returns An array of products
   */
  private extractProductsFromHTML(html: string, query: string): Product[] {
    // Implementation will depend on the platform
    // This is a placeholder that should be customized for each platform
    return [];
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
    await this.cloudScraper.close();
  }
}
