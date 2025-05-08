/**
 * Shopee-specific implementation of CloudScraperAdapter
 */

import * as cheerio from 'cheerio';
import { Product, ScraperInterface } from './types';
import { SearchFilters } from '../shopping-apis';
import { CloudScraper, CloudScraperAdapter } from './cloud-scraper';
import { FallbackGenerator } from './fallback-generator';

/**
 * Selectors for Shopee product elements
 */
const SHOPEE_SELECTORS = {
  productContainer: [
    '[data-sqe="item"]',
    '.shopee-search-item-result__item',
    '[class*="search-item"]',
    '[class*="product-item"]',
    // Additional selectors based on inspection
    'div[class*="col-xs-2"]',
    'div[data-sqe="item"]',
    'div[class*="shopee-search-item-result__item"]'
  ],
  productName: [
    '[data-sqe="name"]',
    '.shopee-item-card__text-name',
    '[class*="product-name"]',
    '[class*="item-name"]',
    // Additional selectors
    'div[class*="name"]',
    'div[class*="title"]'
  ],
  productPrice: [
    '[data-sqe="price"]',
    '.shopee-item-card__current-price',
    '[class*="price"]',
    // Additional selectors
    'div[class*="price"]',
    'span[class*="price"]'
  ],
  productImage: [
    '.shopee-search-item-result__item img',
    '[class*="product-image"] img',
    'img',
    // Additional selectors
    'div[class*="image"] img',
    '_3-N5L6 _2GchKS'
  ],
  productUrl: [
    'a',
    '[class*="product-link"]',
    // Additional selectors
    'a[data-sqe="link"]'
  ],
  productRating: [
    '[class*="rating"]',
    '[data-sqe="rating"]',
    // Additional selectors
    'div[class*="rating"]',
    'div[class*="stars"]'
  ]
};

/**
 * ShopeeCloudScraper - Specialized CloudScraperAdapter for Shopee
 */
export class ShopeeCloudScraper extends CloudScraperAdapter implements ScraperInterface {
  private debug: boolean;
  
  /**
   * Create a new ShopeeCloudScraper
   * 
   * @param options Configuration options
   */
  constructor(options: { debug?: boolean } = {}) {
    super('shopee', options);
    this.debug = options.debug || false;
  }
  
  /**
   * Search for products on Shopee
   * 
   * @param query The search query
   * @param filters Optional filters to apply
   * @returns A promise that resolves to an array of products
   */
  async searchProducts(query: string, filters?: SearchFilters): Promise<Product[]> {
    try {
      if (this.debug) console.log(`[ShopeeCloudScraper] Searching for "${query}" on Shopee`);
      
      // Try to use Shopee's API directly first
      const apiProducts = await this.searchViaApi(query);
      
      if (apiProducts.length > 0) {
        if (this.debug) console.log(`[ShopeeCloudScraper] Found ${apiProducts.length} products via API`);
        return apiProducts;
      }
      
      // If API fails, try scraping the website
      if (this.debug) console.log(`[ShopeeCloudScraper] API search failed, trying web scraping`);
      
      // Build search URL
      const searchUrl = this.buildSearchUrl(query);
      
      // Create a CloudScraper instance
      const cloudScraper = new CloudScraper({ debug: this.debug });
      
      // Get the page content
      const { content } = await cloudScraper.get(searchUrl);
      
      // Extract products from the HTML
      const products = this.extractProductsFromHTML(content, query);
      
      if (this.debug) console.log(`[ShopeeCloudScraper] Found ${products.length} products via web scraping`);
      
      // If no products found, use fallback
      if (products.length === 0) {
        if (this.debug) console.log(`[ShopeeCloudScraper] No products found, using fallback`);
        return FallbackGenerator.generateFallbackProducts(query, 'Shopee', filters);
      }
      
      return products;
    } catch (error) {
      console.error(`[ShopeeCloudScraper] Error searching for "${query}" on Shopee:`, error);
      
      // Use fallback generator when scraping fails
      if (this.debug) console.log(`[ShopeeCloudScraper] Error occurred, using fallback`);
      return FallbackGenerator.generateFallbackProducts(query, 'Shopee', filters);
    }
  }
  
  /**
   * Search for products using Shopee's API
   * 
   * @param query The search query
   * @returns A promise that resolves to an array of products
   */
  private async searchViaApi(query: string): Promise<Product[]> {
    try {
      if (this.debug) console.log(`[ShopeeCloudScraper] Attempting to search via Shopee API`);
      
      // Create a CloudScraper instance
      const cloudScraper = new CloudScraper({ debug: this.debug });
      
      // Build API URL
      const apiUrl = `https://shopee.ph/api/v4/search/search_items?by=relevancy&keyword=${encodeURIComponent(query)}&limit=60&newest=0&order=desc&page_type=search&scenario=PAGE_GLOBAL_SEARCH&version=2`;
      
      // Get the API response
      const { content } = await cloudScraper.get(apiUrl);
      
      // Parse the JSON response
      let response;
      try {
        response = JSON.parse(content);
      } catch (error) {
        if (this.debug) console.log(`[ShopeeCloudScraper] Failed to parse API response as JSON`);
        return [];
      }
      
      // Check if the response contains items
      if (!response || !response.items || !Array.isArray(response.items)) {
        if (this.debug) console.log(`[ShopeeCloudScraper] API response does not contain items array`);
        return [];
      }
      
      // Extract products from the API response
      const products: Product[] = response.items
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
            source: 'shopee-api-scraper'
          };
        });
      
      return products;
    } catch (error) {
      if (this.debug) console.error(`[ShopeeCloudScraper] Error searching via API:`, error);
      return [];
    }
  }
  
  /**
   * Build a search URL for Shopee
   * 
   * @param query The search query
   * @returns The search URL
   */
  private buildSearchUrl(query: string): string {
    const encodedQuery = encodeURIComponent(query);
    return `https://shopee.ph/search?keyword=${encodedQuery}`;
  }
  
  /**
   * Extract products from HTML content
   * 
   * @param html The HTML content
   * @param query The search query
   * @returns An array of products
   */
  private extractProductsFromHTML(html: string, query: string): Product[] {
    const $ = cheerio.load(html);
    const products: Product[] = [];
    
    // Try each product container selector
    for (const containerSelector of SHOPEE_SELECTORS.productContainer) {
      if (this.debug) console.log(`[ShopeeCloudScraper] Trying selector: ${containerSelector}`);
      
      const productElements = $(containerSelector);
      if (this.debug) console.log(`[ShopeeCloudScraper] Found ${productElements.length} elements with selector ${containerSelector}`);
      
      if (productElements.length > 0) {
        // Process each product element
        productElements.each((_, element) => {
          try {
            // Extract product details
            const product = this.extractProductDetails($, element);
            
            // Only add valid products
            if (product.title && product.price > 0) {
              products.push(product);
            }
          } catch (error) {
            if (this.debug) console.error(`[ShopeeCloudScraper] Error extracting product:`, error);
          }
        });
        
        // If we found products with this selector, break the loop
        if (products.length > 0) {
          break;
        }
      }
    }
    
    return products;
  }
  
  /**
   * Extract product details from a product element
   * 
   * @param $ The cheerio instance
   * @param element The product element
   * @returns A product object
   */
  private extractProductDetails($: cheerio.CheerioAPI, element: cheerio.Element): Product {
    // Try each selector for product name
    let title = '';
    for (const selector of SHOPEE_SELECTORS.productName) {
      const nameElement = $(element).find(selector).first();
      if (nameElement.length > 0) {
        title = nameElement.text().trim();
        if (title) break;
      }
    }
    
    // Try each selector for product price
    let priceText = '';
    for (const selector of SHOPEE_SELECTORS.productPrice) {
      const priceElement = $(element).find(selector).first();
      if (priceElement.length > 0) {
        priceText = priceElement.text().trim();
        if (priceText) break;
      }
    }
    
    // Extract numeric price
    const price = this.extractPrice(priceText);
    
    // Try each selector for product image
    let imageUrl = '';
    for (const selector of SHOPEE_SELECTORS.productImage) {
      const imgElement = $(element).find(selector).first();
      if (imgElement.length > 0) {
        imageUrl = imgElement.attr('src') || imgElement.attr('data-src') || '';
        if (imageUrl) break;
      }
    }
    
    // Try each selector for product URL
    let productUrl = '';
    for (const selector of SHOPEE_SELECTORS.productUrl) {
      const linkElement = $(element).find(selector).first();
      if (linkElement.length > 0) {
        productUrl = linkElement.attr('href') || '';
        if (productUrl) break;
      }
    }
    
    // Make sure URL is absolute
    if (productUrl && !productUrl.startsWith('http')) {
      productUrl = `https://shopee.ph${productUrl.startsWith('/') ? '' : '/'}${productUrl}`;
    }
    
    // Try each selector for product rating
    let ratingText = '';
    for (const selector of SHOPEE_SELECTORS.productRating) {
      const ratingElement = $(element).find(selector).first();
      if (ratingElement.length > 0) {
        ratingText = ratingElement.text().trim();
        if (ratingText) break;
      }
    }
    
    // Extract numeric rating
    const ratingMatch = ratingText.match(/(\d+(\.\d+)?)/);
    const rating = ratingMatch ? parseFloat(ratingMatch[1]) : undefined;
    
    return {
      id: `shopee_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
      title,
      price,
      productUrl,
      platform: 'Shopee',
      imageUrl,
      rating,
      source: 'shopee-cloud-scraper'
    };
  }
  
  /**
   * Extract a numeric price from a price string
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
}
