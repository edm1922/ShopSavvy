/**
 * Mock Shopee scraper implementation for testing.
 * This generates mock data instead of actually scraping Shopee.
 */

import { Product, ScraperInterface } from './types';
import { SearchFilters } from '../shopping-apis';

/**
 * Mock scraper for Shopee e-commerce platform.
 */
export class MockShopeeScraperForTesting implements ScraperInterface {
  /**
   * Searches for products on Shopee.
   *
   * @param query The search query.
   * @param filters Optional filters to apply to the search.
   * @returns A promise that resolves to an array of Product objects.
   */
  async searchProducts(query: string, filters?: SearchFilters): Promise<Product[]> {
    console.log(`[MockShopeeScraperForTesting] Generating mock data for query: "${query}"`);
    
    // Generate a deterministic but random-looking number based on the query
    const getQueryHash = (str: string) => {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
      }
      return Math.abs(hash);
    };
    
    const queryHash = getQueryHash(query);
    const numProducts = 10 + (queryHash % 20); // Between 10 and 29 products
    
    const mockProducts: Product[] = [];
    
    // Common product categories for Shopee
    const categories = [
      'Electronics', 'Fashion', 'Home & Living', 'Beauty', 'Toys & Games',
      'Sports & Outdoors', 'Automotive', 'Books & Media', 'Health & Wellness'
    ];
    
    // Generate mock products
    for (let i = 0; i < numProducts; i++) {
      const productId = `shopee_${Date.now()}_${i}`;
      const category = categories[i % categories.length];
      const basePrice = 100 + ((queryHash + i) % 9000); // Between 100 and 9099
      const price = basePrice / 100; // Convert to decimal
      const discountPercentage = i % 5 === 0 ? 10 + (i % 20) : undefined; // Some products have discounts
      const originalPrice = discountPercentage ? price * (100 / (100 - discountPercentage)) : undefined;
      
      mockProducts.push({
        id: productId,
        title: `${query.charAt(0).toUpperCase() + query.slice(1)} ${category} Item ${i + 1}`,
        price,
        originalPrice,
        discountPercentage,
        productUrl: `https://shopee.ph/product/${productId}`,
        platform: 'Shopee',
        imageUrl: `https://cf.shopee.ph/file/mock_image_${i}`,
        rating: 3 + (i % 3), // Between 3 and 5
        ratingCount: 10 + ((queryHash + i) % 990), // Between 10 and 999
        location: 'Philippines',
        sales: 5 + ((queryHash + i) % 995), // Between 5 and 999
        source: 'mock-shopee-scraper'
      });
    }
    
    console.log(`[MockShopeeScraperForTesting] Generated ${mockProducts.length} mock products for Shopee`);
    
    // Apply filters if provided
    if (filters) {
      let filteredProducts = [...mockProducts];
      
      // Apply price filters
      if (filters.minPrice !== undefined) {
        filteredProducts = filteredProducts.filter(p => p.price >= filters.minPrice!);
      }
      
      if (filters.maxPrice !== undefined) {
        filteredProducts = filteredProducts.filter(p => p.price <= filters.maxPrice!);
      }
      
      // Apply brand filter
      if (filters.brand) {
        const brandLower = filters.brand.toLowerCase();
        filteredProducts = filteredProducts.filter(p => 
          p.title.toLowerCase().includes(brandLower)
        );
      }
      
      // Apply rating filter
      if (filters.minRating !== undefined) {
        filteredProducts = filteredProducts.filter(p => 
          (p.rating || 0) >= filters.minRating!
        );
      }
      
      console.log(`[MockShopeeScraperForTesting] After applying filters: ${filteredProducts.length} products`);
      return filteredProducts;
    }
    
    return mockProducts;
  }
  
  /**
   * Gets detailed information about a specific product.
   *
   * @param productId The unique identifier of the product.
   * @returns A promise that resolves to a ProductDetails object, or null if the product is not found.
   */
  async getProductDetails(productId: string): Promise<any> {
    // This is a mock implementation, so we just return null
    return null;
  }
  
  /**
   * Gets reviews for a specific product.
   *
   * @param productId The unique identifier of the product.
   * @param pageNum The page number of reviews to fetch (for pagination).
   * @returns A promise that resolves to an array of ProductReview objects.
   */
  async getProductReviews(productId: string, pageNum: number = 1): Promise<any[]> {
    // This is a mock implementation, so we just return an empty array
    return [];
  }
  
  /**
   * Closes the scraper when it's no longer needed.
   */
  async close(): Promise<void> {
    // Nothing to close in the mock implementation
  }
}
