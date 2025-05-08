/**
 * Shopee scraper implementation using Playwright.
 */

import * as cheerio from 'cheerio';
import { Product, ProductDetails, ProductReview, ScraperInterface } from './types';
import { SearchFilters } from '../shopping-apis';
import { Browser, Page, launchBrowser, createMockBrowser } from './playwright-loader';

/**
 * Scraper for Shopee e-commerce platform using Playwright for browser automation.
 */
export class ShopeeScraper implements ScraperInterface {
  private browser: Browser | null = null;
  private readonly baseUrl = 'https://shopee.ph'; // Using the Philippines domain
  private readonly searchUrl = '/search';
  private readonly productUrl = '/product';
  private readonly userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15',
  ];

  /**
   * Creates a new Shopee scraper.
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
      console.log('[ShopeeScraper] Initializing browser...');

      // Check if we're in a browser environment
      const isBrowser = typeof window !== 'undefined';

      if (isBrowser) {
        // In the browser, use a mock browser
        console.log('[ShopeeScraper] Using mock browser in browser environment');
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
          console.warn('[ShopeeScraper] Failed to launch browser, using mock browser');
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
   * Searches for products on Shopee using Playwright.
   *
   * @param query The search query.
   * @param filters Optional filters to apply to the search.
   * @returns A promise that resolves to an array of Product objects.
   */
  async searchProducts(query: string, filters?: SearchFilters): Promise<Product[]> {
    let page: Page | null = null;

    try {
      console.log(`[ShopeeScraper] Searching for: ${query}`, filters);

      // Check if we're in a browser environment
      if (typeof window !== 'undefined') {
        console.log('[ShopeeScraper] Running in browser environment, returning empty results');
        return [];
      }

      // Build the search URL with query parameters
      let searchQueryUrl = `${this.baseUrl}${this.searchUrl}?keyword=${encodeURIComponent(query)}`;

      // Add filters if provided
      if (filters) {
        if (filters.minPrice && filters.maxPrice) {
          searchQueryUrl += `&price_min=${filters.minPrice * 100000}&price_max=${filters.maxPrice * 100000}`;
        } else if (filters.minPrice) {
          searchQueryUrl += `&price_min=${filters.minPrice * 100000}`;
        } else if (filters.maxPrice) {
          searchQueryUrl += `&price_max=${filters.maxPrice * 100000}`;
        }

        if (filters.brand) {
          searchQueryUrl += `&brand=${encodeURIComponent(filters.brand)}`;
        }

        // Add other filters as needed
      }

      console.log(`[ShopeeScraper] Navigating to: ${searchQueryUrl}`);

      // Create a new page
      page = await this.createStealthPage();

      // Navigate to the search page
      await page.goto(searchQueryUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // Wait for the page to load
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
        console.log('[ShopeeScraper] Timeout waiting for network idle, continuing anyway');
      });

      // Shopee often has a popup when first visiting the site
      await this.handlePopups(page);

      // Scroll down to load more products
      await this.scrollPage(page);

      // Wait for product elements to appear
      await page.waitForSelector('.shopee-search-item-result__item, .col-xs-2-4, [data-sqe="item"]', { timeout: 5000 }).catch(() => {
        console.log('[ShopeeScraper] No product cards found with expected selectors');
      });

      // Extract product data from the page
      const products = await this.extractProductsFromPage(page, query);

      console.log(`[ShopeeScraper] Found ${products.length} products`);

      return products;
    } catch (error) {
      console.error('Error searching Shopee products:', error);
      return [];
    } finally {
      // Close the page to free resources
      if (page) {
        await page.close().catch(() => {});
      }
    }
  }

  /**
   * Handles any popups that might appear when visiting Shopee.
   *
   * @param page The Playwright page.
   */
  private async handlePopups(page: Page): Promise<void> {
    try {
      // Wait for and close language selection popup if it appears
      const languagePopup = await page.$('.shopee-popup__close-btn, .language-selection__close-btn, .home-popup__close-btn');
      if (languagePopup) {
        await languagePopup.click();
        console.log('[ShopeeScraper] Closed language popup');
      }

      // Wait for and close any other popups
      const otherPopups = await page.$$('.shopee-popup__close-btn, .btn-close, [class*="close"]');
      for (const popup of otherPopups) {
        await popup.click().catch(() => {});
        console.log('[ShopeeScraper] Closed a popup');
      }
    } catch (error) {
      console.log('[ShopeeScraper] Error handling popups:', error);
    }
  }

  /**
   * Scrolls the page to load more products.
   *
   * @param page The Playwright page.
   */
  private async scrollPage(page: Page): Promise<void> {
    try {
      // Scroll down a few times to load more products
      for (let i = 0; i < 3; i++) {
        await page.evaluate(() => {
          window.scrollBy(0, 800);
        });
        await page.waitForTimeout(500);
      }
    } catch (error) {
      console.log('[ShopeeScraper] Error scrolling page:', error);
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
        '[data-sqe="item"]',
        '.shopee-search-item-result__item',
        '.col-xs-2-4',
        '.shopee-item-card',
        '.shopee-search-result-item',
        '[class*="search-item"]',
        '[class*="product-card"]',
        '.shopee-result-item',
        'div[data-testid="item-card"]',
        'div[class*="item-card"]',
        'div[class*="product-item"]',
      ];

      for (const selector of selectors) {
        console.log(`[ShopeeScraper] Trying selector: ${selector}`);
        const elements = $(selector);
        console.log(`[ShopeeScraper] Found ${elements.length} elements with selector ${selector}`);

        if (elements.length > 0) {
          elements.each((_, element) => {
            try {
              const el = $(element);

              // Extract the product URL and ID
              const itemUrl = el.find('a').attr('href') || '';
              let shopId = '';
              let itemId = '';

              // Try to extract shop ID and item ID from URL
              const urlMatch = itemUrl.match(/\/(\d+)\/(\d+)/);
              if (urlMatch && urlMatch[1] && urlMatch[2]) {
                shopId = urlMatch[1];
                itemId = urlMatch[2];
              }

              // Extract other product data - try multiple selectors for each field
              let title = '';
              const titleSelectors = [
                '[data-sqe="name"] > div',
                '.shopee-item-card__text-name',
                '[class*="name"]',
                'div[class*="title"]',
                'div[class*="product-name"]',
                'div[class*="item-name"]'
              ];

              for (const selector of titleSelectors) {
                const titleText = el.find(selector).text().trim();
                if (titleText) {
                  title = titleText;
                  break;
                }
              }

              // Extract price using multiple selectors
              let priceText = '';
              const priceSelectors = [
                '[data-sqe="price"]',
                '.shopee-item-card__current-price',
                '[class*="price"]',
                'div[class*="price"]',
                'span[class*="price"]'
              ];

              for (const selector of priceSelectors) {
                const foundPriceText = el.find(selector).text().trim();
                if (foundPriceText) {
                  priceText = foundPriceText;
                  break;
                }
              }

              // Extract image URL
              let imageUrl = '';
              const imgElements = el.find('img');

              // Try different image attributes
              const imgAttrs = ['src', 'data-src', 'data-lazy-src', 'data-original'];

              for (const img of imgElements.toArray()) {
                for (const attr of imgAttrs) {
                  const url = $(img).attr(attr);
                  if (url && url.length > 10 && !url.includes('data:image')) {
                    imageUrl = url;
                    break;
                  }
                }
                if (imageUrl) break;
              }

              if (title && priceText && (shopId && itemId)) {
                const product: Product = {
                  id: `${shopId}_${itemId}`,
                  title,
                  price: this.extractPrice(priceText),
                  productUrl: itemUrl.startsWith('http') ? itemUrl : `${this.baseUrl}${itemUrl}`,
                  platform: 'Shopee',
                  imageUrl,
                  // Additional fields if available
                  originalPrice: this.extractPrice(el.find('[class*="original-price"], [class*="before-discount"]').text()) || undefined,
                  discountPercentage: this.extractDiscountPercentage(el.find('[class*="percent"], [class*="discount"]').text()) || undefined,
                  rating: parseFloat(el.find('[class*="rating"]').attr('style')?.match(/width:\s*(\d+(?:\.\d+)?)%/)?.[1] || '0') / 20 || undefined,
                  ratingCount: parseInt(el.find('[class*="rating-count"], [class*="review-count"]').text().replace(/[^0-9]/g, '')) || undefined,
                  location: el.find('[class*="location"]').text().trim() || undefined,
                  sales: parseInt(el.find('[class*="sold"], [class*="sale"]').text().replace(/[^0-9]/g, '')) || undefined,
                };

                extractedProducts.push(product);
              }
            } catch (error) {
              console.error('Error parsing Shopee product:', error);
            }
          });

          // If we found products with this selector, break the loop
          if (extractedProducts.length > 0) {
            console.log(`[ShopeeScraper] Successfully parsed ${extractedProducts.length} products with selector ${selector}`);
            break;
          }
        }
      }

      if (extractedProducts.length > 0) {
        return extractedProducts;
      }

      // If we still couldn't find any products, try to extract from various global state objects
      console.log('[ShopeeScraper] Trying to extract products from global state objects');

      const products = await page.evaluate(() => {
        try {
          // Try different global state objects that Shopee might use
          const stateObjects = [
            // @ts-ignore
            window.__INITIAL_STATE__,
            // @ts-ignore
            window.__PRELOADED_STATE__,
            // @ts-ignore
            window.__REDUX_STATE__,
            // @ts-ignore
            window.__NEXT_DATA__?.props?.pageProps?.initialReduxState,
            // @ts-ignore
            window.__INITIAL_DATA__
          ];

          for (const state of stateObjects) {
            if (!state) continue;

            // Try different paths where product data might be stored
            const dataPaths = [
              state.items?.data,
              state.searchItems?.items,
              state.search?.items,
              state.data?.items,
              state.searchResult?.items,
              state.productList?.items
            ];

            for (const dataPath of dataPaths) {
              if (Array.isArray(dataPath) && dataPath.length > 0) {
                console.log(`Found ${dataPath.length} products in global state`);

                return dataPath.map((item: any) => {
                  // Try different property names for each field
                  const shopId = item.shopid || item.shop_id || item.seller_id;
                  const itemId = item.itemid || item.item_id || item.id || item.product_id;
                  const name = item.name || item.title || item.product_name;
                  const price = item.price || item.price_min;
                  const image = item.image || item.images?.[0] || item.image_url || item.cover;

                  if (!shopId || !itemId || !name) return null;

                  return {
                    id: `${shopId}_${itemId}`,
                    title: name,
                    price: typeof price === 'number' ? price / 100000 : 0, // Shopee prices are in smallest currency unit
                    productUrl: `/product/${shopId}/${itemId}`,
                    platform: 'Shopee',
                    imageUrl: image || '',
                    originalPrice: item.price_before_discount ? item.price_before_discount / 100000 : undefined,
                    discountPercentage: item.discount || item.discount_percentage,
                    rating: item.item_rating?.rating_star || item.rating,
                    ratingCount: item.item_rating?.rating_count?.[0] || item.rating_count,
                    location: item.shop_location || item.location,
                    sales: item.historical_sold || item.sold || item.sales,
                  };
                }).filter(Boolean); // Remove null items
              }
            }
          }

          return null;
        } catch (e) {
          console.error('Error extracting product data from global state:', e);
          return null;
        }
      });

      if (products && products.length > 0) {
        console.log(`[ShopeeScraper] Extracted ${products.length} products from window.__INITIAL_STATE__`);
        return products;
      }

      // If we still couldn't find any products, try to use Shopee's API directly
      console.log('[ShopeeScraper] Trying to use Shopee API directly');

      try {
        // Shopee API endpoint for search
        const apiUrl = `https://shopee.ph/api/v4/search/search_items?by=relevancy&keyword=${encodeURIComponent(query)}&limit=60&newest=0&order=desc&page_type=search&scenario=PAGE_GLOBAL_SEARCH&version=2`;

        // Set up headers to mimic a browser request
        const headers = {
          'User-Agent': this.getRandomUserAgent(),
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Referer': `https://shopee.ph/search?keyword=${encodeURIComponent(query)}`,
          'X-Requested-With': 'XMLHttpRequest',
          'sec-ch-ua': '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Windows"',
        };

        // Make the API request - pass parameters as a single object
        const apiResponse = await page.evaluate(async (params) => {
          try {
            const response = await fetch(params.url, { headers: params.headers });
            return await response.json();
          } catch (e) {
            console.error('Error fetching from Shopee API:', e);
            return null;
          }
        }, { url: apiUrl, headers: headers });

        if (apiResponse && apiResponse.items && Array.isArray(apiResponse.items)) {
          const apiProducts = apiResponse.items
            .filter((item: any) => item && item.item_basic)
            .map((item: any) => {
              const itemData = item.item_basic;
              return {
                id: `${itemData.shopid}_${itemData.itemid}`,
                title: itemData.name,
                price: itemData.price / 100000, // Shopee prices are in smallest currency unit
                productUrl: `/product/${itemData.shopid}/${itemData.itemid}`,
                platform: 'Shopee',
                imageUrl: `https://cf.shopee.ph/file/${itemData.image}`,
                originalPrice: itemData.price_before_discount ? itemData.price_before_discount / 100000 : undefined,
                discountPercentage: itemData.discount,
                rating: itemData.item_rating?.rating_star,
                ratingCount: itemData.item_rating?.rating_count?.[0],
                location: itemData.shop_location,
                sales: itemData.historical_sold,
              };
            });

          console.log(`[ShopeeScraper] Extracted ${apiProducts.length} products from Shopee API`);
          return apiProducts;
        }
      } catch (error) {
        console.error('Error using Shopee API:', error);
      }

      // We're already in the fallback path, so continue with the API approach

      // Try a direct fetch to the Shopee API
      console.log('[ShopeeScraper] Trying direct fetch to Shopee API');

      try {
        // Close the current page to free resources
        if (page) {
          await page.close().catch(() => {});
          page = null;
        }

        // Create a new page specifically for API calls
        page = await this.createStealthPage();

        // Use the Shopee API directly
        const apiUrl = `https://shopee.ph/api/v4/search/search_items?by=relevancy&keyword=${encodeURIComponent(query)}&limit=60&newest=0&order=desc&page_type=search&scenario=PAGE_GLOBAL_SEARCH&version=2`;

        console.log(`[ShopeeScraper] Fetching from API: ${apiUrl}`);

        // Navigate to Shopee first to set cookies
        await page.goto('https://shopee.ph/', { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Wait a bit and handle any popups
        await page.waitForTimeout(2000);
        await this.handlePopups(page);

        // Now make the API request using page.evaluate
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

        console.log('[ShopeeScraper] API response received, processing...');

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
              };
            });

          console.log(`[ShopeeScraper] Extracted ${apiProducts.length} products from API`);

          if (apiProducts.length > 0) {
            return apiProducts;
          }
        }

        // If API call failed, try a different approach with a new page
        console.log('[ShopeeScraper] API call failed, trying alternative approach with a new page');

        // Close the current page to free resources
        if (page) {
          await page.close().catch(() => {});
          page = null;
        }

        // Create a new page with different settings
        page = await this.createStealthPage();

        // Try the main Shopee URL
        const alternativeUrl = `https://shopee.ph/search?keyword=${encodeURIComponent(query)}`;
        console.log(`[ShopeeScraper] Navigating to alternative URL: ${alternativeUrl}`);

        // Navigate to the alternative URL
        await page.goto(alternativeUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Wait for the page to load
        await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
          console.log('[ShopeeScraper] Timeout waiting for network idle, continuing anyway');
        });

        // Handle any popups
        await this.handlePopups(page);

        // Take a screenshot for debugging
        await page.screenshot({ path: 'shopee-search-debug.png' }).catch(() => {});
        console.log('[ShopeeScraper] Saved screenshot to shopee-search-debug.png for debugging');

        // We've tried everything, return empty results
        console.log('[ShopeeScraper] All approaches failed, returning empty results');
        return [];
      } catch (error) {
        console.error('Error using direct API approach:', error);
        // Return empty results as fallback
        return [];
      } finally {
        // Close the page to free resources
        if (page) {
          await page.close().catch(() => {});
          page = null;
        }
      }

      // If all methods failed, return empty results
      console.log('[ShopeeScraper] All methods failed, returning empty results');

      // Take a screenshot for debugging if we have a page
      if (page) {
        await page.screenshot({ path: 'shopee-search-debug.png' }).catch(() => {});
        console.log('[ShopeeScraper] Saved screenshot to shopee-search-debug.png for debugging');
      }

      return [];
    } catch (error) {
      console.error('Error extracting products from page:', error);
      return [];
    } finally {
      // Close the page to free resources
      if (page) {
        await page.close().catch(() => {});
      }
    }
  }



  /**
   * Gets detailed information about a specific product using Playwright.
   *
   * @param productId The unique identifier of the product.
   * @returns A promise that resolves to a ProductDetails object, or null if the product is not found.
   */
  async getProductDetails(productId: string): Promise<ProductDetails | null> {
    let page: Page | null = null;

    try {
      console.log(`[ShopeeScraper] Getting product details for: ${productId}`);

      // Extract shop ID and item ID from the product ID (format: "shopId_itemId")
      const [shopId, itemId] = productId.split('_');

      if (!shopId || !itemId) {
        throw new Error(`Invalid product ID format: ${productId}`);
      }

      // Build the product URL
      const productUrl = `${this.baseUrl}${this.productUrl}/${shopId}/${itemId}`;

      console.log(`[ShopeeScraper] Navigating to: ${productUrl}`);

      // Create a new page
      page = await this.createStealthPage();

      // Navigate to the product page
      await page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // Wait for the page to load
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
        console.log('[ShopeeScraper] Timeout waiting for network idle, continuing anyway');
      });

      // Handle any popups
      await this.handlePopups(page);

      // Extract product details from the page
      const productDetails = await this.extractProductDetailsFromPage(page, productId);

      if (productDetails) {
        console.log(`[ShopeeScraper] Successfully extracted details for product: ${productId}`);
        return productDetails;
      }

      console.log(`[ShopeeScraper] Failed to extract details for product: ${productId}`);
      return null;
    } catch (error) {
      console.error('Error getting Shopee product details:', error);
      return null;
    } finally {
      // Close the page to free resources
      if (page) {
        await page.close().catch(() => {});
      }
    }
  }

  /**
   * Extracts product details from a Playwright page.
   *
   * @param page The Playwright page.
   * @param productId The product ID.
   * @returns A promise that resolves to a ProductDetails object, or null if extraction fails.
   */
  private async extractProductDetailsFromPage(page: Page, productId: string): Promise<ProductDetails | null> {
    try {
      // First, try to extract product data from the window.__INITIAL_DATA__ object
      const productDetails = await page.evaluate((productId) => {
        try {
          // @ts-ignore
          const data = window.__INITIAL_DATA__;
          if (data && data.pdpGetData && data.pdpGetData.data) {
            const item = data.pdpGetData.data;

            // Extract specifications
            const specifications: Record<string, string> = {};
            if (item.attributes && Array.isArray(item.attributes)) {
              item.attributes.forEach((attr: any) => {
                if (attr.name && attr.value) {
                  specifications[attr.name] = attr.value;
                }
              });
            }

            // Extract shop ID and item ID from the product ID
            const [shopId, itemId] = productId.split('_');

            return {
              id: productId,
              title: item.name || '',
              price: item.price / 100000, // Shopee prices are in smallest currency unit
              productUrl: `/product/${shopId}/${itemId}`,
              platform: 'Shopee',
              imageUrl: item.images && item.images.length > 0 ? item.images[0] : '',
              description: item.description || '',
              brand: item.brand || '',
              originalPrice: item.price_before_discount ? item.price_before_discount / 100000 : undefined,
              discountPercentage: item.discount ? item.discount : undefined,
              rating: item.item_rating?.rating_star,
              ratingCount: item.item_rating?.rating_count?.[0],
              specifications,
              inStock: item.stock > 0,
              shippingInfo: item.shipping_info || '',
              sellerName: item.shop?.name || '',
              sellerRating: item.shop?.rating_star,
            };
          }
          return null;
        } catch (e) {
          console.error('Error extracting product details from window.__INITIAL_DATA__:', e);
          return null;
        }
      }, productId);

      if (productDetails) {
        console.log('[ShopeeScraper] Extracted product details from window.__INITIAL_DATA__');
        return productDetails;
      }

      // If we couldn't extract from window.__INITIAL_DATA__, try to extract from the DOM
      console.log('[ShopeeScraper] Extracting product details from DOM...');

      // Get the HTML content
      const content = await page.content();

      // Use cheerio to parse the HTML
      const $ = cheerio.load(content);

      // Extract basic product data
      const title = $('.product-briefing .product-title, [class*="product-title"], [class*="product-name"]').text().trim();
      const priceText = $('.product-briefing [class*="price"], [class*="product-price"]').text().trim();
      const imageUrl = $('.product-briefing img, [class*="product-image"] img').attr('src') || '';

      // Extract additional details
      const description = $('.product-detail [class*="description"], [class*="product-description"]').text().trim();
      const brand = $('.product-detail [class*="brand"], [class*="product-brand"]').text().trim() || undefined;

      // Extract specifications
      const specifications: Record<string, string> = {};
      $('.product-detail [class*="specification"] [class*="key"], [class*="product-specification"] [class*="key"]').each((_, element) => {
        const key = $(element).text().trim();
        const value = $(element).next().text().trim();
        if (key && value) {
          specifications[key] = value;
        }
      });

      // Extract seller information
      const sellerName = $('.product-briefing [class*="shop-name"], [class*="seller-name"]').text().trim() || undefined;
      const sellerRatingText = $('.product-briefing [class*="shop-rating"], [class*="seller-rating"]').text().trim();
      const sellerRating = sellerRatingText ? parseFloat(sellerRatingText) : undefined;

      // Check if product is in stock
      const inStock = !$('.product-briefing [class*="out-of-stock"], [class*="sold-out"]').length;

      // Extract shipping information
      const shippingInfo = $('.product-briefing [class*="shipping"], [class*="delivery"]').text().trim() || undefined;

      // Create the product details object
      if (title && priceText) {
        const [shopId, itemId] = productId.split('_');

        const productDetails: ProductDetails = {
          id: productId,
          title,
          price: this.extractPrice(priceText),
          productUrl: `${this.baseUrl}${this.productUrl}/${shopId}/${itemId}`,
          platform: 'Shopee',
          imageUrl,
          description,
          brand,
          specifications: Object.keys(specifications).length > 0 ? specifications : undefined,
          inStock,
          shippingInfo,
          sellerName,
          sellerRating,
        };

        return productDetails;
      }

      // If we still couldn't extract product details, take a screenshot for debugging
      await page.screenshot({ path: `shopee-product-${productId}-debug.png` });
      console.log(`[ShopeeScraper] Saved screenshot to shopee-product-${productId}-debug.png for debugging`);

      return null;
    } catch (error) {
      console.error('Error extracting product details from page:', error);
      return null;
    }
  }

  /**
   * Gets reviews for a specific product using Playwright.
   *
   * @param productId The unique identifier of the product.
   * @param pageNum The page number of reviews to fetch (for pagination).
   * @returns A promise that resolves to an array of ProductReview objects.
   */
  async getProductReviews(productId: string, pageNum: number = 1): Promise<ProductReview[]> {
    let page: Page | null = null;

    try {
      console.log(`[ShopeeScraper] Getting product reviews for: ${productId}, page: ${pageNum}`);

      // Extract shop ID and item ID from the product ID (format: "shopId_itemId")
      const [shopId, itemId] = productId.split('_');

      if (!shopId || !itemId) {
        throw new Error(`Invalid product ID format: ${productId}`);
      }

      // Build the reviews URL
      const reviewsUrl = `${this.baseUrl}${this.productUrl}/${shopId}/${itemId}/rating?page=${pageNum}`;

      console.log(`[ShopeeScraper] Navigating to: ${reviewsUrl}`);

      // Create a new page
      page = await this.createStealthPage();

      // Navigate to the reviews page
      await page.goto(reviewsUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // Wait for the page to load
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
        console.log('[ShopeeScraper] Timeout waiting for network idle, continuing anyway');
      });

      // Handle any popups
      await this.handlePopups(page);

      // Extract reviews from the page
      const reviews = await this.extractReviewsFromPage(page, productId, pageNum);

      console.log(`[ShopeeScraper] Found ${reviews.length} reviews for product: ${productId}, page: ${pageNum}`);

      return reviews;
    } catch (error) {
      console.error('Error getting Shopee product reviews:', error);
      return [];
    } finally {
      // Close the page to free resources
      if (page) {
        await page.close().catch(() => {});
      }
    }
  }

  /**
   * Extracts product reviews from a Playwright page.
   *
   * @param page The Playwright page.
   * @param productId The product ID.
   * @param pageNum The page number.
   * @returns A promise that resolves to an array of ProductReview objects.
   */
  private async extractReviewsFromPage(page: Page, productId: string, pageNum: number): Promise<ProductReview[]> {
    try {
      // First, try to extract reviews from the window.__INITIAL_DATA__ object
      const reviews = await page.evaluate(() => {
        try {
          // @ts-ignore
          const data = window.__INITIAL_DATA__;
          if (data && data.ratingList && data.ratingList.ratings && Array.isArray(data.ratingList.ratings)) {
            return data.ratingList.ratings.map((review: any) => ({
              id: review.itemid ? `${review.itemid}_${review.cmtid}` : review.cmtid || '',
              reviewer: review.author_username || 'Anonymous',
              rating: review.rating_star || 0,
              comment: review.comment || '',
              date: review.ctime ? new Date(review.ctime * 1000).toISOString().split('T')[0] : '',
              images: review.images && Array.isArray(review.images) ? review.images.map((img: any) => img.url) : undefined,
              verifiedPurchase: review.is_verified_purchase || false,
            }));
          }
          return null;
        } catch (e) {
          console.error('Error extracting reviews from window.__INITIAL_DATA__:', e);
          return null;
        }
      });

      if (reviews && reviews.length > 0) {
        console.log(`[ShopeeScraper] Extracted ${reviews.length} reviews from window.__INITIAL_DATA__`);
        return reviews;
      }

      // If we couldn't extract from window.__INITIAL_DATA__, try to extract from the DOM
      console.log('[ShopeeScraper] Extracting reviews from DOM...');

      // Get the HTML content
      const content = await page.content();

      // Use cheerio to parse the HTML
      const $ = cheerio.load(content);
      const extractedReviews: ProductReview[] = [];

      // Try different selectors for review containers
      const selectors = [
        '.shopee-product-rating-item',
        '[class*="rating-item"]',
        '[class*="review-item"]',
        '[class*="comment-item"]',
      ];

      for (const selector of selectors) {
        console.log(`[ShopeeScraper] Trying selector: ${selector}`);
        const elements = $(selector);
        console.log(`[ShopeeScraper] Found ${elements.length} elements with selector ${selector}`);

        if (elements.length > 0) {
          elements.each((_, element) => {
            try {
              const el = $(element);

              // Extract review data
              const id = el.attr('data-review-id') || el.attr('data-cmtid') || `review-${productId}-${Math.random().toString(36).substring(2, 10)}`;

              const ratingEl = el.find('[class*="rating-stars"], [class*="rating-star-wrapper"]');
              const ratingStyle = ratingEl.attr('style') || '';
              const ratingMatch = ratingStyle.match(/width:\s*(\d+(?:\.\d+)?)%/);
              const rating = ratingMatch ? parseFloat(ratingMatch[1]) / 20 : 0;

              const comment = el.find('[class*="comment-text"], [class*="review-content"], [class*="comment-content"]').text().trim();
              const date = el.find('[class*="review-date"], [class*="comment-date"], [class*="time"]').text().trim();
              const reviewer = el.find('[class*="author-name"], [class*="username"], [class*="reviewer"]').text().trim() || 'Anonymous';

              // Extract review images
              const images: string[] = [];
              el.find('[class*="review-image"] img, [class*="comment-image"] img').each((_, img) => {
                const src = $(img).attr('src');
                if (src) {
                  images.push(src);
                }
              });

              // Check if verified purchase
              const verifiedPurchase = el.find('[class*="verified-purchase"], [class*="verified-label"]').length > 0;

              if (comment) {
                const review: ProductReview = {
                  id,
                  rating,
                  comment,
                  date,
                  reviewer,
                  images: images.length > 0 ? images : undefined,
                  verifiedPurchase,
                };

                extractedReviews.push(review);
              }
            } catch (error) {
              console.error('Error parsing Shopee review:', error);
            }
          });

          // If we found reviews with this selector, break the loop
          if (extractedReviews.length > 0) {
            console.log(`[ShopeeScraper] Successfully parsed ${extractedReviews.length} reviews with selector ${selector}`);
            break;
          }
        }
      }

      if (extractedReviews.length > 0) {
        return extractedReviews;
      }

      // If we still couldn't find any reviews, take a screenshot for debugging
      await page.screenshot({ path: `shopee-reviews-${productId}-page${pageNum}-debug.png` });
      console.log(`[ShopeeScraper] Saved screenshot to shopee-reviews-${productId}-page${pageNum}-debug.png for debugging`);

      return [];
    } catch (error) {
      console.error('Error extracting reviews from page:', error);
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
   * Extracts the discount percentage from a discount string.
   *
   * @param discountString The discount string.
   * @returns The discount percentage as a number.
   */
  private extractDiscountPercentage(discountString: string): number | undefined {
    if (!discountString) return undefined;
    // Extract percentage value from strings like "-20%" or "20% OFF"
    const match = discountString.match(/(\d+)%/);
    if (match && match[1]) {
      return parseInt(match[1]);
    }
    return undefined;
  }

  /**
   * Closes the browser when the scraper is no longer needed.
   * This should be called when the application is shutting down.
   */
  async close(): Promise<void> {
    if (this.browser) {
      console.log('[ShopeeScraper] Closing browser...');
      await this.browser.close();
      this.browser = null;
    }
  }
}
