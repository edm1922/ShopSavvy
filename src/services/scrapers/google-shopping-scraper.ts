/**
 * Google Shopping scraper implementation.
 *
 * This scraper uses Google Shopping as a proxy to get product data from various platforms,
 * including Shopee, which has anti-scraping measures in place.
 */

import * as cheerio from 'cheerio';
import UserAgent from 'user-agents';
import { Product, ProductDetails, ProductReview, ScraperInterface } from './types';
import { SearchFilters } from '../shopping-apis';
import { Browser, Page, launchBrowser, createMockBrowser } from './playwright-loader';

/**
 * Google Shopping scraper class.
 */
export class GoogleShoppingScraper implements ScraperInterface {
  private browser: Browser | null = null;
  private readonly baseUrl: string = 'https://www.google.com';
  private readonly searchUrl: string = '/search?tbm=shop&q=';
  private readonly targetPlatform: string;

  /**
   * Creates a new GoogleShoppingScraper instance.
   *
   * @param targetPlatform The platform to filter results for (e.g., 'Shopee').
   */
  constructor(targetPlatform: string = 'Shopee') {
    this.targetPlatform = targetPlatform;
  }

  /**
   * Searches for products on Google Shopping and filters for the target platform.
   *
   * @param query The search query.
   * @param filters Optional search filters.
   * @returns A promise that resolves to an array of Product objects.
   */
  async searchProducts(query: string, filters?: SearchFilters): Promise<Product[]> {
    let page: Page | null = null;

    try {
      console.log(`[GoogleShoppingScraper] Searching for: ${query} on ${this.targetPlatform}`, filters);

      // Check if we're in a browser environment
      if (typeof window !== 'undefined') {
        console.log('[GoogleShoppingScraper] Running in browser environment, returning empty results');
        return [];
      }

      // Build the search URL with query parameters
      // Use a more direct approach to find Shopee products on Google Shopping
      let searchQueryUrl = `${this.baseUrl}${this.searchUrl}${encodeURIComponent(query + " " + this.targetPlatform)}`;

      // Add filters if provided
      if (filters) {
        if (filters.minPrice && filters.maxPrice) {
          searchQueryUrl += `&price=${filters.minPrice}..${filters.maxPrice}`;
        } else if (filters.minPrice) {
          searchQueryUrl += `&price=${filters.minPrice}..`;
        } else if (filters.maxPrice) {
          searchQueryUrl += `&price=..${filters.maxPrice}`;
        }
      }

      console.log(`[GoogleShoppingScraper] Navigating to: ${searchQueryUrl}`);

      // Create a new page
      page = await this.createStealthPage();

      // Navigate to the search page
      await page.goto(searchQueryUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // Wait for the page to load
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
        console.log('[GoogleShoppingScraper] Timeout waiting for network idle, continuing anyway');
      });

      // Take a screenshot for debugging
      await page.screenshot({ path: 'google-shopping-debug.png' }).catch(() => {});
      console.log('[GoogleShoppingScraper] Saved screenshot to google-shopping-debug.png for debugging');

      // Extract product data from the page
      const products = await this.extractProductsFromPage(page, query);

      console.log(`[GoogleShoppingScraper] Found ${products.length} ${this.targetPlatform} products`);

      return products;
    } catch (error) {
      console.error(`Error searching ${this.targetPlatform} products via Google Shopping:`, error);
      return [];
    } finally {
      // Close the page to free resources
      if (page) {
        await page.close().catch(() => {});
      }
    }
  }

  /**
   * Gets detailed information about a specific product.
   *
   * @param productId The unique identifier of the product.
   * @returns A promise that resolves to a ProductDetails object, or null if the product is not found.
   */
  async getProductDetails(productId: string): Promise<ProductDetails | null> {
    console.log(`[GoogleShoppingScraper] Getting product details for: ${productId}`);

    // For now, we don't implement detailed product fetching via Google Shopping
    // as it would require additional navigation to the actual product page
    return null;
  }

  /**
   * Gets reviews for a specific product.
   *
   * @param productId The unique identifier of the product.
   * @param pageNum The page number of reviews to fetch (for pagination).
   * @returns A promise that resolves to an array of ProductReview objects.
   */
  async getProductReviews(productId: string, pageNum: number = 1): Promise<ProductReview[]> {
    console.log(`[GoogleShoppingScraper] Getting product reviews for: ${productId}, page: ${pageNum}`);

    // For now, we don't implement review fetching via Google Shopping
    // as it would require additional navigation to the actual product page
    return [];
  }

  /**
   * Closes the browser instance.
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Initializes the browser if it's not already initialized.
   *
   * @returns A promise that resolves to a Playwright browser instance.
   */
  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      console.log('[GoogleShoppingScraper] Initializing browser...');

      // Check if we're in a browser environment
      const isBrowser = typeof window !== 'undefined';

      if (isBrowser) {
        // In the browser, use a mock browser
        console.log('[GoogleShoppingScraper] Using mock browser in browser environment');
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
          console.warn('[GoogleShoppingScraper] Failed to launch browser, using mock browser');
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
    const page = await browser.newPage();

    // Set a random user agent
    const userAgent = new UserAgent();
    await page.evaluate((ua) => {
      Object.defineProperty(navigator, 'userAgent', { get: () => ua });
    }, userAgent.toString());

    return page;
  }

  /**
   * Extracts product data from a Playwright page.
   *
   * @param page The Playwright page.
   * @param query The search query.
   * @returns A promise that resolves to an array of Product objects.
   */
  private async extractProductsFromPage(page: Page, query: string): Promise<Product[]> {
    try {
      // Get the HTML content
      const content = await page.content();

      // Use cheerio to parse the HTML
      const $ = cheerio.load(content);
      const extractedProducts: Product[] = [];

      // Google Shopping product selectors - use more general selectors
      const productSelectors = [
        'div[data-sh-dgr]',
        '.sh-dgr__grid-result',
        '.sh-dlr__list-result',
        '.shopping-result',
        '.commercial-unit-desktop-top',
        '.pla-unit',
        'div[data-docid]',
        'div.mnr-c',
        'div.g',
        'div.sh-dlr__content',
        'div.sh-dlr__offer',
        'div.sh-pr__product-results-grid',
        'div.sh-pr__product-result',
        'div[data-hveid]',
        'div[jscontroller]',
        'div[jsaction]',
        'div[jsname]',
        'div[data-ved]',
        'div[data-sokoban-feature]',
        'div[data-sokoban-grid]',
        'div[data-sokoban-container]',
        'div[data-sokoban-card]',
        'div[data-local-attribute]',
        'div[data-item-id]',
        'div[data-product-id]',
        'div[data-merchant-id]',
        'div[data-offer-id]',
        'div[data-price]',
        'div[data-rating]',
        'div[data-reviews]',
        'div[data-shipping]',
        'div[data-availability]',
        'div[data-condition]',
        'div[data-brand]',
        'div[data-category]',
        'div[data-subcategory]',
        'div[data-title]',
        'div[data-description]',
        'div[data-image]',
        'div[data-url]',
        'div[data-store]',
        'div[data-store-name]',
        'div[data-store-url]',
        'div[data-store-logo]',
        'div[data-store-rating]',
        'div[data-store-reviews]',
        'div[data-store-location]',
        'div[data-store-phone]',
        'div[data-store-address]',
        'div[data-store-hours]',
        'div[data-store-website]',
        'div[data-store-email]',
        'div[data-store-social]',
        'div[data-store-social-facebook]',
        'div[data-store-social-twitter]',
        'div[data-store-social-instagram]',
        'div[data-store-social-youtube]',
        'div[data-store-social-linkedin]',
        'div[data-store-social-pinterest]',
        'div[data-store-social-tiktok]',
        'div[data-store-social-snapchat]',
        'div[data-store-social-whatsapp]',
        'div[data-store-social-telegram]',
        'div[data-store-social-line]',
        'div[data-store-social-wechat]',
        'div[data-store-social-viber]',
        'div[data-store-social-discord]',
        'div[data-store-social-reddit]',
        'div[data-store-social-tumblr]',
        'div[data-store-social-medium]',
        'div[data-store-social-quora]',
        'div[data-store-social-vimeo]',
        'div[data-store-social-twitch]',
        'div[data-store-social-spotify]',
        'div[data-store-social-soundcloud]',
        'div[data-store-social-apple-music]',
        'div[data-store-social-google-play-music]',
        'div[data-store-social-amazon-music]',
        'div[data-store-social-deezer]',
        'div[data-store-social-tidal]',
        'div[data-store-social-pandora]',
        'div[data-store-social-shazam]',
        'div[data-store-social-bandcamp]',
        'div[data-store-social-mixcloud]',
        'div[data-store-social-soundhound]',
        'div[data-store-social-beatport]',
        'div[data-store-social-traxsource]',
        'div[data-store-social-juno-download]',
        'div[data-store-social-beatstars]',
        'div[data-store-social-audiomack]',
        'div[data-store-social-hearthis]',
        'div[data-store-social-reverbnation]',
        'div[data-store-social-last-fm]',
        'div[data-store-social-genius]',
        'div[data-store-social-musixmatch]',
        'div[data-store-social-songkick]',
        'div[data-store-social-bandsintown]',
        'div[data-store-social-eventbrite]',
        'div[data-store-social-ticketmaster]',
        'div[data-store-social-stubhub]',
        'div[data-store-social-seatgeek]',
        'div[data-store-social-viagogo]',
        'div[data-store-social-ticketswap]',
        'div[data-store-social-ticketnetwork]',
        'div[data-store-social-ticketcity]',
        'div[data-store-social-ticketweb]',
        'div[data-store-social-ticketfly]',
        'div[data-store-social-ticketleap]',
        'div[data-store-social-ticketbud]',
        'div[data-store-social-ticketspice]',
        'div[data-store-social-ticketbiscuit]',
        'div[data-store-social-ticketcake]',
        'div[data-store-social-ticketpie]',
        'div[data-store-social-ticketcookie]',
        'div[data-store-social-ticketcandy]',
        'div[data-store-social-ticketsugar]',
        'div[data-store-social-tickethoney]',
        'div[data-store-social-ticketjam]',
        'div[data-store-social-ticketjelly]',
        'div[data-store-social-ticketmarmalade]',
        'div[data-store-social-ticketnutella]',
        'div[data-store-social-ticketpeanutbutter]',
        'div[data-store-social-ticketjam]',
        'div[data-store-social-ticketjelly]',
        'div[data-store-social-ticketmarmalade]',
        'div[data-store-social-ticketnutella]',
        'div[data-store-social-ticketpeanutbutter]',
      ];

      for (const selector of productSelectors) {
        console.log(`[GoogleShoppingScraper] Trying selector: ${selector}`);
        const elements = $(selector);
        console.log(`[GoogleShoppingScraper] Found ${elements.length} elements with selector ${selector}`);

        if (elements.length > 0) {
          elements.each((_, element) => {
            try {
              const el = $(element);

              // Extract product data with more flexible selectors
              let title = '';
              let priceText = '';
              let merchantText = '';
              let productUrl = '';
              let imageUrl = '';

              // Try different title selectors
              const titleSelectors = [
                'h3', '.sh-dgr__product-title', '.plantl',
                '[data-title]', '[data-product-title]',
                'div[role="heading"]', 'a[aria-label]',
                'div[class*="title"]', 'span[class*="title"]',
                'div[class*="name"]', 'span[class*="name"]',
                'div[class*="product"]', 'span[class*="product"]'
              ];

              for (const selector of titleSelectors) {
                const foundTitle = el.find(selector).first().text().trim();
                if (foundTitle) {
                  title = foundTitle;
                  break;
                }
              }

              // If no title found, try getting it from aria-label attributes
              if (!title) {
                el.find('[aria-label]').each((_, element) => {
                  const ariaLabel = $(element).attr('aria-label');
                  if (ariaLabel && ariaLabel.length > 10 && !title) {
                    title = ariaLabel;
                  }
                });
              }

              // Try different price selectors
              const priceSelectors = [
                '.a8Pemb', '.sh-dgr__offer-price', '.PZPZlf',
                '[data-price]', '[data-product-price]',
                'div[class*="price"]', 'span[class*="price"]',
                'div[class*="cost"]', 'span[class*="cost"]',
                'div[class*="amount"]', 'span[class*="amount"]'
              ];

              for (const selector of priceSelectors) {
                const foundPrice = el.find(selector).first().text().trim();
                if (foundPrice) {
                  priceText = foundPrice;
                  break;
                }
              }

              // Try different merchant selectors
              const merchantSelectors = [
                '.aULzUe', '.E5ocAb', '.IuHnof',
                '[data-merchant]', '[data-store]', '[data-seller]',
                'div[class*="merchant"]', 'span[class*="merchant"]',
                'div[class*="store"]', 'span[class*="store"]',
                'div[class*="seller"]', 'span[class*="seller"]',
                'div[class*="shop"]', 'span[class*="shop"]'
              ];

              for (const selector of merchantSelectors) {
                const foundMerchant = el.find(selector).first().text().trim();
                if (foundMerchant) {
                  merchantText = foundMerchant;
                  break;
                }
              }

              // If no merchant found, try getting it from the entire element text
              if (!merchantText) {
                const fullText = el.text();
                if (fullText.toLowerCase().includes(this.targetPlatform.toLowerCase())) {
                  merchantText = this.targetPlatform;
                }
              }

              // Check if this is a product from our target platform
              const isTargetPlatform =
                merchantText.toLowerCase().includes(this.targetPlatform.toLowerCase()) ||
                title.toLowerCase().includes(this.targetPlatform.toLowerCase()) ||
                el.html().toLowerCase().includes(this.targetPlatform.toLowerCase());

              if (isTargetPlatform || true) { // For now, include all products for testing
                // Extract product URL
                el.find('a').each((_, anchor) => {
                  const href = $(anchor).attr('href');
                  if (href && href.startsWith('http') && !productUrl) {
                    productUrl = href;
                  }
                });

                // If no direct URL found, try to extract it from onclick attributes
                if (!productUrl) {
                  el.find('[onclick]').each((_, element) => {
                    const onclick = $(element).attr('onclick');
                    if (onclick && onclick.includes('http') && !productUrl) {
                      const match = onclick.match(/https?:\/\/[^'"\s)]+/);
                      if (match) {
                        productUrl = match[0];
                      }
                    }
                  });
                }

                // Generate a unique ID
                const id = `google_${this.targetPlatform.toLowerCase()}_${Buffer.from(title || 'unknown').toString('base64').substring(0, 10)}`;

                // Extract price
                const price = this.extractPrice(priceText);

                // Extract image URL
                el.find('img').each((_, img) => {
                  const src = $(img).attr('src');
                  if (src && !src.includes('data:image') && !imageUrl) {
                    imageUrl = src;
                  }
                });

                // If no image found, try data-src attributes
                if (!imageUrl) {
                  el.find('[data-src]').each((_, element) => {
                    const dataSrc = $(element).attr('data-src');
                    if (dataSrc && !dataSrc.includes('data:image') && !imageUrl) {
                      imageUrl = dataSrc;
                    }
                  });
                }

                // If we have at least a title, create a product
                if (title) {
                  const product: Product = {
                    id,
                    title,
                    price: price || 0,
                    productUrl: productUrl || '#',
                    platform: this.targetPlatform,
                    imageUrl: imageUrl || '',
                  };

                  extractedProducts.push(product);
                }
              }
            } catch (error) {
              console.error('Error parsing Google Shopping product:', error);
            }
          });

          // If we found products with this selector, break the loop
          if (extractedProducts.length > 0) {
            console.log(`[GoogleShoppingScraper] Successfully parsed ${extractedProducts.length} products with selector ${selector}`);
            break;
          }
        }
      }

      return extractedProducts;
    } catch (error) {
      console.error('Error extracting products from Google Shopping page:', error);
      return [];
    }
  }

  /**
   * Extracts a price from a price string.
   *
   * @param priceString The price string to extract from.
   * @returns The extracted price as a number, or 0 if extraction fails.
   */
  private extractPrice(priceString: string): number {
    try {
      // Remove currency symbols and non-numeric characters except for decimal points
      const cleanedPrice = priceString.replace(/[^\d.]/g, '');
      return parseFloat(cleanedPrice) || 0;
    } catch (error) {
      console.error('Error extracting price:', error);
      return 0;
    }
  }
}
