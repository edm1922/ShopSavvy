/**
 * Temu-specific implementation of CloudScraperAdapter
 */

import * as cheerio from 'cheerio';
import { Product, ScraperInterface } from './types';
import { SearchFilters } from '../shopping-apis';
import { CloudScraper, CloudScraperAdapter } from './cloud-scraper';
import { FallbackGenerator } from './fallback-generator';

/**
 * Selectors for Temu product elements
 */
const TEMU_SELECTORS = {
  productContainer: [
    '.product-item', 
    '[data-testid="product-card"]', 
    '[class*="product-card"]',
    '[class*="product-item"]',
    '[class*="search-result-item"]',
    '[class*="goods-item"]',
    // Additional selectors based on inspection
    'div[class*="SearchItem"]',
    'div[class*="ProductCard"]',
    'div[class*="ProductItem"]'
  ],
  productName: [
    '[class*="title"]', 
    '[class*="name"]', 
    'h2', 
    'h3',
    '.product-title',
    '.item-name',
    // Additional selectors
    'div[class*="Title"]',
    'div[class*="Name"]',
    'span[class*="Title"]'
  ],
  productPrice: [
    '[class*="price"]', 
    '[class*="current-price"]',
    '.product-price',
    '.item-price',
    // Additional selectors
    'div[class*="Price"]',
    'span[class*="Price"]',
    'div[class*="priceValue"]'
  ],
  productImage: [
    'img', 
    '[class*="image"] img',
    '.product-image img',
    // Additional selectors
    'div[class*="Image"] img',
    'div[class*="Thumbnail"] img'
  ],
  productUrl: [
    'a', 
    '[class*="product-link"]',
    '[class*="item-link"]',
    // Additional selectors
    'a[href*="product"]',
    'a[href*="item"]'
  ],
  productRating: [
    '[class*="rating"]', 
    '[class*="stars"]',
    '.product-rating',
    // Additional selectors
    'div[class*="Rating"]',
    'span[class*="Rating"]',
    'div[class*="Stars"]'
  ]
};

/**
 * TemuCloudScraper - Specialized CloudScraperAdapter for Temu
 */
export class TemuCloudScraper extends CloudScraperAdapter implements ScraperInterface {
  private debug: boolean;
  
  /**
   * Create a new TemuCloudScraper
   * 
   * @param options Configuration options
   */
  constructor(options: { debug?: boolean } = {}) {
    super('temu', options);
    this.debug = options.debug || false;
  }
  
  /**
   * Search for products on Temu
   * 
   * @param query The search query
   * @param filters Optional filters to apply
   * @returns A promise that resolves to an array of products
   */
  async searchProducts(query: string, filters?: SearchFilters): Promise<Product[]> {
    try {
      if (this.debug) console.log(`[TemuCloudScraper] Searching for "${query}" on Temu`);
      
      // Build search URL
      const searchUrl = this.buildSearchUrl(query);
      
      // Create a CloudScraper instance
      const cloudScraper = new CloudScraper({ debug: this.debug });
      
      // Get the page content
      const { content } = await cloudScraper.get(searchUrl);
      
      // Extract products from the HTML
      const products = this.extractProductsFromHTML(content, query);
      
      if (this.debug) console.log(`[TemuCloudScraper] Found ${products.length} products`);
      
      // If no products found, use fallback
      if (products.length === 0) {
        if (this.debug) console.log(`[TemuCloudScraper] No products found, using fallback`);
        return FallbackGenerator.generateFallbackProducts(query, 'Temu', filters);
      }
      
      return products;
    } catch (error) {
      console.error(`[TemuCloudScraper] Error searching for "${query}" on Temu:`, error);
      
      // Use fallback generator when scraping fails
      if (this.debug) console.log(`[TemuCloudScraper] Error occurred, using fallback`);
      return FallbackGenerator.generateFallbackProducts(query, 'Temu', filters);
    }
  }
  
  /**
   * Build a search URL for Temu
   * 
   * @param query The search query
   * @returns The search URL
   */
  private buildSearchUrl(query: string): string {
    const encodedQuery = encodeURIComponent(query);
    return `https://www.temu.com/search_result.html?search_key=${encodedQuery}`;
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
    for (const containerSelector of TEMU_SELECTORS.productContainer) {
      if (this.debug) console.log(`[TemuCloudScraper] Trying selector: ${containerSelector}`);
      
      const productElements = $(containerSelector);
      if (this.debug) console.log(`[TemuCloudScraper] Found ${productElements.length} elements with selector ${containerSelector}`);
      
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
            if (this.debug) console.error(`[TemuCloudScraper] Error extracting product:`, error);
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
    for (const selector of TEMU_SELECTORS.productName) {
      const nameElement = $(element).find(selector).first();
      if (nameElement.length > 0) {
        title = nameElement.text().trim();
        if (title) break;
      }
    }
    
    // Try each selector for product price
    let priceText = '';
    for (const selector of TEMU_SELECTORS.productPrice) {
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
    for (const selector of TEMU_SELECTORS.productImage) {
      const imgElement = $(element).find(selector).first();
      if (imgElement.length > 0) {
        imageUrl = imgElement.attr('src') || imgElement.attr('data-src') || '';
        if (imageUrl) break;
      }
    }
    
    // Try each selector for product URL
    let productUrl = '';
    for (const selector of TEMU_SELECTORS.productUrl) {
      const linkElement = $(element).find(selector).first();
      if (linkElement.length > 0) {
        productUrl = linkElement.attr('href') || '';
        if (productUrl) break;
      }
    }
    
    // Make sure URL is absolute
    if (productUrl && !productUrl.startsWith('http')) {
      productUrl = `https://www.temu.com${productUrl.startsWith('/') ? '' : '/'}${productUrl}`;
    }
    
    // Try each selector for product rating
    let ratingText = '';
    for (const selector of TEMU_SELECTORS.productRating) {
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
      id: `temu_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
      title,
      price,
      productUrl,
      platform: 'Temu',
      imageUrl,
      rating,
      source: 'temu-cloud-scraper'
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
