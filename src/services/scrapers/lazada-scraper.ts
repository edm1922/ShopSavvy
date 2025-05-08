/**
 * Lazada scraper implementation using Playwright.
 */

import * as cheerio from 'cheerio';
import { chromium, Browser, Page } from 'playwright';
import { Product, ProductDetails, ProductReview, ScraperError, ScraperInterface } from './types';
import { SearchFilters } from '../shopping-apis';

/**
 * Scraper for Lazada e-commerce platform using Playwright for browser automation.
 */
export class LazadaScraper implements ScraperInterface {
  private browser: Browser | null = null;
  private readonly baseUrl = 'https://www.lazada.com.ph';
  private readonly searchUrl = '/catalog';
  private readonly productUrl = '/products';
  private readonly userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Safari/605.1.15',
  ];

  /**
   * Creates a new Lazada scraper.
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
      console.log('[LazadaScraper] Initializing browser...');
      this.browser = await chromium.launch({
        headless: true, // Run in headless mode
      });
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
   * Searches for products on Lazada using Playwright.
   *
   * @param query The search query.
   * @param filters Optional filters to apply to the search.
   * @returns A promise that resolves to an array of Product objects.
   */
  async searchProducts(query: string, filters?: SearchFilters): Promise<Product[]> {
    let page: Page | null = null;

    try {
      console.log(`[LazadaScraper] Searching for: ${query}`, filters);

      // Build the search URL with query parameters
      let searchQueryUrl = `${this.baseUrl}${this.searchUrl}/?q=${encodeURIComponent(query)}`;

      // Add filters if provided
      if (filters) {
        if (filters.minPrice && filters.maxPrice) {
          searchQueryUrl += `&price=${filters.minPrice}-${filters.maxPrice}`;
        } else if (filters.minPrice) {
          searchQueryUrl += `&price=${filters.minPrice}-`;
        }

        if (filters.brand) {
          searchQueryUrl += `&brand=${encodeURIComponent(filters.brand)}`;
        }

        // Add other filters as needed
      }

      console.log(`[LazadaScraper] Navigating to: ${searchQueryUrl}`);

      // Create a new page
      page = await this.createStealthPage();

      // Navigate to the search page
      await page.goto(searchQueryUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // Wait for the page to load
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
        console.log('[LazadaScraper] Timeout waiting for network idle, continuing anyway');
      });

      // Wait for product elements to appear
      await page.waitForSelector('[data-tracking="product-card"]', { timeout: 5000 }).catch(() => {
        console.log('[LazadaScraper] No product cards found with [data-tracking="product-card"] selector');
      });

      // Extract product data from the page
      const products = await this.extractProductsFromPage(page, query);

      console.log(`[LazadaScraper] Found ${products.length} products`);

      return products;
    } catch (error) {
      console.error('Error searching Lazada products:', error);
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
      // First, try to extract product data from the window.__INITIAL_STATE__ object
      const products = await page.evaluate(() => {
        try {
          // @ts-ignore
          const state = window.__INITIAL_STATE__;
          if (state && state.items && Array.isArray(state.items.result)) {
            return state.items.result.map((item: any) => ({
              id: item.itemId || item.nid || '',
              title: item.name || '',
              price: parseFloat(item.price) || 0,
              productUrl: item.productUrl || item.itemUrl || '',
              platform: 'Lazada',
              imageUrl: item.image || '',
              originalPrice: item.originalPrice ? parseFloat(item.originalPrice) : undefined,
              discountPercentage: item.discount ? parseFloat(item.discount) : undefined,
              rating: item.ratingScore ? parseFloat(item.ratingScore) : undefined,
              ratingCount: item.review ? parseInt(item.review) : undefined,
              location: item.location || undefined,
              sales: item.sold ? parseInt(item.sold) : undefined,
            }));
          }
          return null;
        } catch (e) {
          console.error('Error extracting product data from window.__INITIAL_STATE__:', e);
          return null;
        }
      });

      if (products && products.length > 0) {
        console.log(`[LazadaScraper] Extracted ${products.length} products from window.__INITIAL_STATE__`);
        return products;
      }

      // If we couldn't extract from window.__INITIAL_STATE__, try to extract from the DOM
      console.log('[LazadaScraper] Extracting products from DOM...');

      // Get the HTML content
      const content = await page.content();

      // Use cheerio to parse the HTML
      const $ = cheerio.load(content);
      const extractedProducts: Product[] = [];

      // Try different selectors for product cards
      const selectors = [
        '[data-tracking="product-card"]',
        '.Bm3ON',
        '.c1_t2i',
        '.c2prKC',
        '.c3KeDq',
        '.c16H9d',
        '.card-product',
        '.product-card',
        '.item-card',
      ];

      for (const selector of selectors) {
        console.log(`[LazadaScraper] Trying selector: ${selector}`);
        const elements = $(selector);
        console.log(`[LazadaScraper] Found ${elements.length} elements with selector ${selector}`);

        if (elements.length > 0) {
          elements.each((_, element) => {
            try {
              const el = $(element);

              // Try different selectors for product data
              const titleSelectors = ['.RfADt', '.c16H9d', '.c3KeDq', '.title', 'h2', '.product-title', '.item-title'];
              const priceSelectors = ['.ooOxS', '.c3gUW0', '.price', '.product-price', '.item-price'];
              const imageSelectors = ['img', '.image img', '.product-image img', '.item-image img'];

              // Find the first matching selector
              const findText = (selectors: string[]) => {
                for (const s of selectors) {
                  const text = el.find(s).text().trim();
                  if (text) return text;
                }
                return '';
              };

              const findAttr = (selectors: string[], attr: string) => {
                for (const s of selectors) {
                  const value = el.find(s).attr(attr);
                  if (value) return value;
                }
                return '';
              };

              // Extract the product data
              const productUrl = el.find('a').attr('href') || '';
              const productId = this.extractProductIdFromUrl(productUrl);
              const title = findText(titleSelectors);
              const priceText = findText(priceSelectors);
              const imageUrl = findAttr(imageSelectors, 'src');

              if (title && priceText && productUrl) {
                const product: Product = {
                  id: productId,
                  title,
                  price: this.extractPrice(priceText),
                  productUrl: productUrl.startsWith('http') ? productUrl : this.baseUrl + productUrl,
                  platform: 'Lazada',
                  imageUrl,
                  // Additional fields if available
                  originalPrice: this.extractPrice(findText(['.WNoq3', '.original-price', '.old-price'])) || undefined,
                  discountPercentage: this.extractDiscountPercentage(findText(['.IcOsH', '.discount', '.discount-percentage'])) || undefined,
                  rating: parseFloat(el.find('.rating').attr('data-rating') || '0') || undefined,
                  ratingCount: parseInt(findText(['.rating-count', '.review-count']).replace(/[^0-9]/g, '')) || undefined,
                  location: findText(['.oa6ri', '.location', '.seller-location']) || undefined,
                };

                extractedProducts.push(product);
              }
            } catch (error) {
              console.error('Error parsing Lazada product:', error);
            }
          });

          // If we found products with this selector, break the loop
          if (extractedProducts.length > 0) {
            console.log(`[LazadaScraper] Successfully parsed ${extractedProducts.length} products with selector ${selector}`);
            break;
          }
        }
      }

      if (extractedProducts.length > 0) {
        return extractedProducts;
      }

      // If we still couldn't find any products, take a screenshot for debugging
      await page.screenshot({ path: 'lazada-search-debug.png' });
      console.log('[LazadaScraper] Saved screenshot to lazada-search-debug.png for debugging');

      // Return an empty array if no products were found
      return [];
    } catch (error) {
      console.error('Error extracting products from page:', error);
      return [];
    }
  }

  /**
   * Parses the API response from a search request.
   *
   * @param data The API response data.
   * @param query The search query.
   * @returns An array of Product objects.
   */
  private parseApiResponse(data: any, query: string): Product[] {
    try {
      const products: Product[] = [];

      // Check if the response contains product data
      if (data && data.mods && data.mods.listItems) {
        const items = data.mods.listItems;

        // Parse each product
        items.forEach((item: any) => {
          try {
            const product: Product = {
              id: item.itemId || item.nid || '',
              title: item.name || '',
              price: parseFloat(item.price) || 0,
              productUrl: this.baseUrl + (item.productUrl || item.itemUrl || ''),
              platform: 'Lazada',
              imageUrl: item.image || '',
              // Additional fields if available
              originalPrice: item.originalPrice ? parseFloat(item.originalPrice) : undefined,
              discountPercentage: item.discount ? parseFloat(item.discount) : undefined,
              rating: item.ratingScore ? parseFloat(item.ratingScore) : undefined,
              ratingCount: item.review ? parseInt(item.review) : undefined,
              location: item.location || undefined,
              sales: item.sold ? parseInt(item.sold) : undefined,
            };

            products.push(product);
          } catch (error) {
            console.error('Error parsing Lazada product from API:', error);
          }
        });
      }

      return products;
    } catch (error) {
      console.error('Error parsing Lazada API response:', error);
      return [];
    }
  }

  /**
   * Gets mock products for testing purposes.
   *
   * @param query The search query.
   * @param count The number of mock products to generate.
   * @returns An array of mock Product objects.
   */
  private getMockProducts(query: string, count: number): Product[] {
    const products: Product[] = [];

    for (let i = 1; i <= count; i++) {
      const product: Product = {
        id: `mock-${i}`,
        title: `${query.charAt(0).toUpperCase() + query.slice(1)} ${i}`,
        price: Math.floor(Math.random() * 10000) + 1000,
        productUrl: `${this.baseUrl}/products/mock-product-${i}`,
        platform: 'Lazada',
        imageUrl: `https://picsum.photos/seed/${query}-${i}/400/300`,
        originalPrice: Math.floor(Math.random() * 15000) + 2000,
        discountPercentage: Math.floor(Math.random() * 50) + 10,
        rating: Math.random() * 4 + 1,
        ratingCount: Math.floor(Math.random() * 1000) + 10,
        location: 'Philippines',
      };

      products.push(product);
    }

    return products;
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
      console.log(`[LazadaScraper] Getting product details for: ${productId}`);

      // Build the product URL
      const productUrl = `${this.baseUrl}${this.productUrl}/${productId}`;

      console.log(`[LazadaScraper] Navigating to: ${productUrl}`);

      // Create a new page
      page = await this.createStealthPage();

      // Navigate to the product page
      await page.goto(productUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // Wait for the page to load
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
        console.log('[LazadaScraper] Timeout waiting for network idle, continuing anyway');
      });

      // Extract product details from the page
      const productDetails = await this.extractProductDetailsFromPage(page, productId);

      if (productDetails) {
        console.log(`[LazadaScraper] Successfully extracted details for product: ${productId}`);
        return productDetails;
      }

      console.log(`[LazadaScraper] Failed to extract details for product: ${productId}`);
      return null;
    } catch (error) {
      console.error('Error getting Lazada product details:', error);
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
      // First, try to extract product data from the window.__INITIAL_STATE__ object
      const productDetails = await page.evaluate((productId) => {
        try {
          // @ts-ignore
          const state = window.__INITIAL_STATE__;
          if (state && state.pdpData && state.pdpData.item) {
            const item = state.pdpData.item;

            // Extract specifications
            const specifications: Record<string, string> = {};
            if (item.specifications && Array.isArray(item.specifications)) {
              item.specifications.forEach((spec: any) => {
                if (spec.name && spec.value) {
                  specifications[spec.name] = spec.value;
                }
              });
            }

            return {
              id: productId,
              title: item.title || item.name || '',
              price: parseFloat(item.price) || 0,
              productUrl: window.location.href,
              platform: 'Lazada',
              imageUrl: item.image || (item.images && item.images.length > 0 ? item.images[0] : ''),
              description: item.description || '',
              brand: item.brand || '',
              originalPrice: item.originalPrice ? parseFloat(item.originalPrice) : undefined,
              discountPercentage: item.discount ? parseFloat(item.discount) : undefined,
              rating: item.rating ? parseFloat(item.rating) : undefined,
              ratingCount: item.review ? parseInt(item.review) : undefined,
              specifications,
              inStock: item.quantity > 0,
              shippingInfo: item.shipping || '',
              sellerName: item.seller?.name || '',
              sellerRating: item.seller?.rating ? parseFloat(item.seller.rating) : undefined,
            };
          }
          return null;
        } catch (e) {
          console.error('Error extracting product details from window.__INITIAL_STATE__:', e);
          return null;
        }
      }, productId);

      if (productDetails) {
        console.log('[LazadaScraper] Extracted product details from window.__INITIAL_STATE__');
        return productDetails;
      }

      // If we couldn't extract from window.__INITIAL_STATE__, try to extract from the DOM
      console.log('[LazadaScraper] Extracting product details from DOM...');

      // Get the HTML content
      const content = await page.content();

      // Use cheerio to parse the HTML
      const $ = cheerio.load(content);

      // Extract basic product data
      const title = $('.pdp-mod-product-badge-title').text().trim() ||
                   $('h1').text().trim() ||
                   $('[data-pdp="title"]').text().trim();

      const priceText = $('.pdp-product-price__current').text().trim() ||
                       $('[data-pdp="price"]').text().trim();

      const imageUrl = $('.gallery-preview-panel__image').attr('src') ||
                      $('img.pdp-mod-common-image').attr('src') ||
                      $('.item-gallery img').attr('src') || '';

      const description = $('.html-content.pdp-product-highlights').text().trim() ||
                         $('.pdp-product-description').text().trim() ||
                         $('[data-pdp="description"]').text().trim();

      const brand = $('.pdp-product-brand__brand-link').text().trim() ||
                   $('[data-pdp="brand"]').text().trim() || '';

      // Extract specifications
      const specifications: Record<string, string> = {};
      $('.specification-keys').each((_, element) => {
        const key = $(element).text().trim();
        const value = $(element).next('.specification-values').text().trim();
        if (key && value) {
          specifications[key] = value;
        }
      });

      // Extract seller information
      const sellerName = $('.seller-name__detail').text().trim() ||
                        $('[data-pdp="seller-name"]').text().trim() || '';

      const sellerRatingText = $('.seller-info-value.rating-positive').text().trim() ||
                              $('[data-pdp="seller-rating"]').text().trim();
      const sellerRating = sellerRatingText ? parseFloat(sellerRatingText) : undefined;

      // Check if product is in stock
      const inStock = !$('.quantity-content').text().includes('Out of Stock') &&
                     !$('[data-pdp="stock"]').text().includes('Out of Stock');

      // Extract shipping information
      const shippingInfo = $('.delivery-option-item__title').text().trim() ||
                          $('[data-pdp="shipping"]').text().trim() || '';

      // Create the product details object
      if (title && priceText) {
        const productDetails: ProductDetails = {
          id: productId,
          title,
          price: this.extractPrice(priceText),
          productUrl: page.url(),
          platform: 'Lazada',
          imageUrl,
          description,
          brand,
          specifications,
          inStock,
          shippingInfo,
          sellerName,
          sellerRating,
        };

        return productDetails;
      }

      // If we still couldn't extract product details, take a screenshot for debugging
      await page.screenshot({ path: `lazada-product-${productId}-debug.png` });
      console.log(`[LazadaScraper] Saved screenshot to lazada-product-${productId}-debug.png for debugging`);

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
   * @param page The page number of reviews to fetch (for pagination).
   * @returns A promise that resolves to an array of ProductReview objects.
   */
  async getProductReviews(productId: string, pageNum: number = 1): Promise<ProductReview[]> {
    let page: Page | null = null;

    try {
      console.log(`[LazadaScraper] Getting product reviews for: ${productId}, page: ${pageNum}`);

      // Build the reviews URL
      const reviewsUrl = `${this.baseUrl}${this.productUrl}/${productId}/reviews?page=${pageNum}`;

      console.log(`[LazadaScraper] Navigating to: ${reviewsUrl}`);

      // Create a new page
      page = await this.createStealthPage();

      // Navigate to the reviews page
      await page.goto(reviewsUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

      // Wait for the page to load
      await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
        console.log('[LazadaScraper] Timeout waiting for network idle, continuing anyway');
      });

      // Extract reviews from the page
      const reviews = await this.extractReviewsFromPage(page, productId, pageNum);

      console.log(`[LazadaScraper] Found ${reviews.length} reviews for product: ${productId}, page: ${pageNum}`);

      return reviews;
    } catch (error) {
      console.error('Error getting Lazada product reviews:', error);
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
      // First, try to extract reviews from the window.__INITIAL_STATE__ object
      const reviews = await page.evaluate(() => {
        try {
          // @ts-ignore
          const state = window.__INITIAL_STATE__;
          if (state && state.pdpData && state.pdpData.reviews && Array.isArray(state.pdpData.reviews)) {
            return state.pdpData.reviews.map((review: any) => ({
              id: review.id || review.reviewId || '',
              rating: parseFloat(review.rating) || 0,
              comment: review.content || review.comment || '',
              date: review.reviewTime || review.date || '',
              reviewer: review.reviewer?.name || review.userName || 'Anonymous',
              images: review.images && Array.isArray(review.images) ? review.images : undefined,
            }));
          }
          return null;
        } catch (e) {
          console.error('Error extracting reviews from window.__INITIAL_STATE__:', e);
          return null;
        }
      });

      if (reviews && reviews.length > 0) {
        console.log(`[LazadaScraper] Extracted ${reviews.length} reviews from window.__INITIAL_STATE__`);
        return reviews;
      }

      // If we couldn't extract from window.__INITIAL_STATE__, try to extract from the DOM
      console.log('[LazadaScraper] Extracting reviews from DOM...');

      // Get the HTML content
      const content = await page.content();

      // Use cheerio to parse the HTML
      const $ = cheerio.load(content);
      const extractedReviews: ProductReview[] = [];

      // Try different selectors for review containers
      const selectors = [
        '.item-review-wrapper',
        '.mod-reviews',
        '.review-item',
        '[data-review-id]',
        '.review-container',
      ];

      for (const selector of selectors) {
        console.log(`[LazadaScraper] Trying selector: ${selector}`);
        const elements = $(selector);
        console.log(`[LazadaScraper] Found ${elements.length} elements with selector ${selector}`);

        if (elements.length > 0) {
          elements.each((_, element) => {
            try {
              const el = $(element);

              // Extract review data
              const id = el.attr('data-review-id') || `review-${productId}-${Math.random().toString(36).substring(2, 10)}`;

              const ratingEl = el.find('.review-stars, .rating-stars');
              const rating = ratingEl.attr('data-rating') ||
                            ratingEl.find('span[style*="width"]').attr('style')?.match(/width:\s*(\d+)%/)?.[1];

              const comment = el.find('.item-review-content, .review-content, .comment').text().trim();
              const date = el.find('.review-time, .review-date, .date').text().trim();
              const reviewer = el.find('.reviewer-name, .user-name, .author').text().trim() || 'Anonymous';

              // Extract review images
              const images: string[] = [];
              el.find('.review-image img, .gallery-item img').each((_, img) => {
                const src = $(img).attr('src');
                if (src) {
                  images.push(src);
                }
              });

              if (comment) {
                const review: ProductReview = {
                  id,
                  rating: rating ? parseFloat(rating) / 20 : 0, // Convert percentage to 0-5 scale
                  comment,
                  date,
                  reviewer,
                  images: images.length > 0 ? images : undefined,
                };

                extractedReviews.push(review);
              }
            } catch (error) {
              console.error('Error parsing Lazada review:', error);
            }
          });

          // If we found reviews with this selector, break the loop
          if (extractedReviews.length > 0) {
            console.log(`[LazadaScraper] Successfully parsed ${extractedReviews.length} reviews with selector ${selector}`);
            break;
          }
        }
      }

      if (extractedReviews.length > 0) {
        return extractedReviews;
      }

      // If we still couldn't find any reviews, take a screenshot for debugging
      await page.screenshot({ path: `lazada-reviews-${productId}-page${pageNum}-debug.png` });
      console.log(`[LazadaScraper] Saved screenshot to lazada-reviews-${productId}-page${pageNum}-debug.png for debugging`);

      return [];
    } catch (error) {
      console.error('Error extracting reviews from page:', error);
      return [];
    }
  }

  /**
   * Parses the HTML response from a search request.
   *
   * @param html The HTML response.
   * @returns An array of Product objects.
   */
  private parseSearchResults(html: string): Product[] {
    try {
      const $ = cheerio.load(html);
      const products: Product[] = [];

      console.log('[LazadaScraper] Parsing search results...');

      // Lazada loads product data via JavaScript, so we need to look for JSON data in the script tags
      // This is a common pattern for modern e-commerce sites
      let productData: any[] = [];

      // Try to find the script tag containing the product data
      $('script').each((_, element) => {
        const scriptContent = $(element).html() || '';
        if (scriptContent.includes('window.pageData')) {
          try {
            // Extract the JSON data using regex
            const match = scriptContent.match(/window\.pageData\s*=\s*({.*?});/s);
            if (match && match[1]) {
              const pageData = JSON.parse(match[1]);
              if (pageData && pageData.mods && pageData.mods.listItems) {
                productData = pageData.mods.listItems;
                console.log(`[LazadaScraper] Found ${productData.length} products in script data`);
              }
            }
          } catch (e) {
            console.error('Error parsing Lazada script data:', e);
          }
        }
      });

      // If we couldn't find the data in scripts, try to parse the HTML directly
      if (productData.length === 0) {
        console.log('[LazadaScraper] No product data found in scripts, trying to parse HTML directly');

        // Try different selectors for product cards
        const selectors = [
          '.Bm3ON', // Original selector
          '.c1_t2i', // Alternative selector
          '.c2prKC', // Another alternative
          '.c3KeDq', // Another alternative
          '.c16H9d', // Another alternative
          '[data-tracking="product-card"]', // Generic attribute
          '.card-product', // Generic class
          '.product-card', // Generic class
          '.item-card', // Generic class
        ];

        // Try each selector
        for (const selector of selectors) {
          console.log(`[LazadaScraper] Trying selector: ${selector}`);
          const elements = $(selector);
          console.log(`[LazadaScraper] Found ${elements.length} elements with selector ${selector}`);

          if (elements.length > 0) {
            elements.each((_, element) => {
              try {
                const itemElement = $(element);

                // Try different selectors for product data
                const titleSelectors = ['.RfADt', '.c16H9d', '.c3KeDq', '.title', 'h2', '.product-title', '.item-title'];
                const priceSelectors = ['.ooOxS', '.c3gUW0', '.price', '.product-price', '.item-price'];
                const imageSelectors = ['img', '.image img', '.product-image img', '.item-image img'];

                // Find the first matching selector
                const findText = (selectors: string[]) => {
                  for (const s of selectors) {
                    const text = itemElement.find(s).text().trim();
                    if (text) return text;
                  }
                  return '';
                };

                const findAttr = (selectors: string[], attr: string) => {
                  for (const s of selectors) {
                    const value = itemElement.find(s).attr(attr);
                    if (value) return value;
                  }
                  return '';
                };

                // Extract the product data
                const productUrl = itemElement.find('a').attr('href') || '';
                const productId = this.extractProductIdFromUrl(productUrl);
                const title = findText(titleSelectors);
                const priceText = findText(priceSelectors);
                const imageUrl = findAttr(imageSelectors, 'src');

                if (title && priceText && productUrl) {
                  const product: Product = {
                    id: productId,
                    title,
                    price: this.extractPrice(priceText),
                    productUrl: productUrl.startsWith('http') ? productUrl : this.baseUrl + productUrl,
                    platform: 'Lazada',
                    imageUrl,
                    // Additional fields if available
                    originalPrice: this.extractPrice(findText(['.WNoq3', '.original-price', '.old-price'])) || undefined,
                    discountPercentage: this.extractDiscountPercentage(findText(['.IcOsH', '.discount', '.discount-percentage'])) || undefined,
                    rating: parseFloat(itemElement.find('.rating').attr('data-rating') || '0') || undefined,
                    ratingCount: parseInt(findText(['.rating-count', '.review-count']).replace(/[^0-9]/g, '')) || undefined,
                    location: findText(['.oa6ri', '.location', '.seller-location']) || undefined,
                  };

                  products.push(product);
                }
              } catch (error) {
                console.error('Error parsing Lazada product:', error);
              }
            });

            // If we found products with this selector, break the loop
            if (products.length > 0) {
              console.log(`[LazadaScraper] Successfully parsed ${products.length} products with selector ${selector}`);
              break;
            }
          }
        }

        // If we still couldn't find any products, try a more generic approach
        if (products.length === 0) {
          console.log('[LazadaScraper] No products found with specific selectors, trying generic approach');

          // Look for any elements that might be product cards
          $('a').each((_, element) => {
            try {
              const itemElement = $(element);
              const href = itemElement.attr('href') || '';

              // Check if this looks like a product URL
              if (href.includes('/products/') || href.includes('-i') && href.includes('-s')) {
                const productUrl = href;
                const productId = this.extractProductIdFromUrl(productUrl);

                // Look for title and price near this element
                const title = itemElement.text().trim() || itemElement.find('h2, .title, .name').text().trim();
                const priceElement = itemElement.find('.price, [data-price], [class*="price"]');
                const priceText = priceElement.text().trim();
                const imageUrl = itemElement.find('img').attr('src') || '';

                if (title && priceText && productUrl) {
                  const product: Product = {
                    id: productId,
                    title,
                    price: this.extractPrice(priceText),
                    productUrl: productUrl.startsWith('http') ? productUrl : this.baseUrl + productUrl,
                    platform: 'Lazada',
                    imageUrl,
                  };

                  products.push(product);
                }
              }
            } catch (error) {
              console.error('Error parsing Lazada product with generic approach:', error);
            }
          });
        }
      } else {
        // Parse the product data from the JSON
        productData.forEach(item => {
          try {
            const product: Product = {
              id: item.itemId || item.nid || '',
              title: item.name || '',
              price: parseFloat(item.price) || 0,
              productUrl: this.baseUrl + (item.productUrl || item.itemUrl || ''),
              platform: 'Lazada',
              imageUrl: item.image || '',
              // Additional fields if available
              originalPrice: item.originalPrice ? parseFloat(item.originalPrice) : undefined,
              discountPercentage: item.discount ? parseFloat(item.discount) : undefined,
              rating: item.ratingScore ? parseFloat(item.ratingScore) : undefined,
              ratingCount: item.review ? parseInt(item.review) : undefined,
              location: item.location || undefined,
              sales: item.sold ? parseInt(item.sold) : undefined,
            };

            products.push(product);
          } catch (error) {
            console.error('Error parsing Lazada product from JSON:', error);
          }
        });
      }

      console.log(`[LazadaScraper] Returning ${products.length} products`);
      return products;
    } catch (error) {
      console.error('Error parsing Lazada search results:', error);
      return [];
    }
  }

  /**
   * Parses the HTML response from a product details request.
   *
   * @param html The HTML response.
   * @param productId The product ID.
   * @returns A ProductDetails object, or null if parsing fails.
   */
  private parseProductDetails(html: string, productId: string): ProductDetails | null {
    try {
      const $ = cheerio.load(html);

      // Try to extract product data from JSON in script tags first
      let productData: any = null;

      $('script').each((_, element) => {
        const scriptContent = $(element).html() || '';
        if (scriptContent.includes('__moduleData__')) {
          try {
            const match = scriptContent.match(/__moduleData__\s*=\s*({.*?});/s);
            if (match && match[1]) {
              const moduleData = JSON.parse(match[1]);
              if (moduleData && moduleData.data && moduleData.data.root && moduleData.data.root.fields) {
                productData = moduleData.data.root.fields;
              }
            }
          } catch (e) {
            console.error('Error parsing Lazada product script data:', e);
          }
        }
      });

      if (productData) {
        // Extract data from the JSON
        const title = productData.product?.title || productData.title || '';
        const price = parseFloat(productData.product?.price || productData.price || '0');
        const imageUrl = productData.product?.images?.[0] || productData.image || '';
        const description = productData.product?.description || productData.description || '';
        const brand = productData.product?.brand || productData.brand || undefined;

        // Create the product details object
        const productDetails: ProductDetails = {
          id: productId,
          title,
          price,
          productUrl: `${this.baseUrl}${this.productUrl}/${productId}`,
          platform: 'Lazada',
          imageUrl,
          description,
          brand,
          // Add other fields as available
        };

        return productDetails;
      }

      // Fallback to HTML parsing if JSON extraction fails
      const productContainer = $('.pdp-product-price');

      if (!productContainer.length) {
        return null;
      }

      // Extract basic product data
      const title = $('.pdp-mod-product-badge-title').text().trim();
      const price = this.extractPrice($('.pdp-product-price__current').text());
      const imageUrl = $('.gallery-preview-panel__image').attr('src') || '';

      // Extract additional details
      const description = $('.html-content.pdp-product-highlights').text().trim();
      const brand = $('.pdp-product-brand__brand-link').text().trim() || undefined;

      // Create the product details object
      const productDetails: ProductDetails = {
        id: productId,
        title,
        price,
        productUrl: `${this.baseUrl}${this.productUrl}/${productId}`,
        platform: 'Lazada',
        imageUrl,
        description,
        brand,
      };

      return productDetails;
    } catch (error) {
      console.error('Error parsing Lazada product details:', error);
      return null;
    }
  }

  /**
   * Parses the HTML response from a product reviews request.
   *
   * @param html The HTML response.
   * @returns An array of ProductReview objects.
   */
  private parseProductReviews(html: string): ProductReview[] {
    try {
      const $ = cheerio.load(html);
      const reviews: ProductReview[] = [];

      // Try to extract reviews data from JSON in script tags first
      let reviewsData: any[] = [];

      $('script').each((_, element) => {
        const scriptContent = $(element).html() || '';
        if (scriptContent.includes('__moduleData__')) {
          try {
            const match = scriptContent.match(/__moduleData__\s*=\s*({.*?});/s);
            if (match && match[1]) {
              const moduleData = JSON.parse(match[1]);
              if (moduleData && moduleData.data && moduleData.data.reviews) {
                reviewsData = moduleData.data.reviews;
              }
            }
          } catch (e) {
            console.error('Error parsing Lazada reviews script data:', e);
          }
        }
      });

      if (reviewsData.length > 0) {
        // Parse reviews from JSON data
        reviewsData.forEach(item => {
          try {
            const review: ProductReview = {
              id: item.reviewId || '',
              rating: parseFloat(item.rating) || 0,
              comment: item.content || '',
              date: item.reviewTime || '',
              reviewer: item.reviewer?.name || 'Anonymous',
            };

            reviews.push(review);
          } catch (error) {
            console.error('Error parsing Lazada review from JSON:', error);
          }
        });
      } else {
        // Fallback to HTML parsing
        $('.item-review-wrapper').each((_, element) => {
          try {
            const reviewElement = $(element);

            const review: ProductReview = {
              id: reviewElement.attr('data-review-id') || '',
              rating: parseFloat(reviewElement.find('.review-stars').attr('data-rating') || '0'),
              comment: reviewElement.find('.item-review-content').text().trim(),
              date: reviewElement.find('.review-time').text().trim(),
              reviewer: reviewElement.find('.reviewer-name').text().trim() || 'Anonymous',
            };

            reviews.push(review);
          } catch (error) {
            console.error('Error parsing Lazada review:', error);
          }
        });
      }

      return reviews;
    } catch (error) {
      console.error('Error parsing Lazada product reviews:', error);
      return [];
    }
  }

  /**
   * Extracts the product ID from a product URL.
   *
   * @param url The product URL.
   * @returns The product ID.
   */
  private extractProductIdFromUrl(url: string): string {
    // Example URL: /products/i123456789-s987654321.html
    const match = url.match(/\/products\/i(\d+)-s(\d+)\.html/);
    if (match && match[1] && match[2]) {
      return `${match[1]}_${match[2]}`;
    }

    // Alternative format: /product-name-i123456789-s987654321.html
    const altMatch = url.match(/\/.*?-i(\d+)-s(\d+)\.html/);
    if (altMatch && altMatch[1] && altMatch[2]) {
      return `${altMatch[1]}_${altMatch[2]}`;
    }

    // If no match, return the whole URL as ID
    return url;
  }

  /**
   * Extracts the price from a price string.
   *
   * @param priceString The price string.
   * @returns The price as a number.
   */
  private extractPrice(priceString: string): number {
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
      console.log('[LazadaScraper] Closing browser...');
      await this.browser.close();
      this.browser = null;
    }
  }
}
