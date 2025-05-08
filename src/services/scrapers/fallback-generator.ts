/**
 * Fallback generator for when scraping fails
 */

import { Product } from './types';
import { SearchFilters } from '../shopping-apis';

/**
 * Generates fallback products when scraping fails
 */
export class FallbackGenerator {
  /**
   * Generate fallback products for a query
   * 
   * @param query The search query
   * @param platform The platform name
   * @param filters Optional search filters
   * @returns An array of fallback products
   */
  static generateFallbackProducts(
    query: string,
    platform: string,
    filters?: SearchFilters
  ): Product[] {
    console.log(`[FallbackGenerator] Generating fallback products for ${platform} with query: "${query}"`);
    
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
    
    const fallbackProducts: Product[] = [];
    
    // Common product categories
    const categories = [
      'Electronics', 'Fashion', 'Home & Living', 'Beauty', 'Toys & Games',
      'Sports & Outdoors', 'Automotive', 'Books & Media', 'Health & Wellness'
    ];
    
    // Generate fallback products
    for (let i = 0; i < numProducts; i++) {
      const productId = `${platform.toLowerCase()}_${Date.now()}_${i}`;
      const category = categories[i % categories.length];
      const basePrice = 100 + ((queryHash + i) % 9000); // Between 100 and 9099
      const price = basePrice / 100; // Convert to decimal
      const discountPercentage = i % 5 === 0 ? 10 + (i % 20) : undefined; // Some products have discounts
      const originalPrice = discountPercentage ? price * (100 / (100 - discountPercentage)) : undefined;
      
      // Apply filters if provided
      if (filters) {
        if (filters.minPrice !== undefined && price < filters.minPrice) {
          continue;
        }
        
        if (filters.maxPrice !== undefined && price > filters.maxPrice) {
          continue;
        }
      }
      
      fallbackProducts.push({
        id: productId,
        title: `${query.charAt(0).toUpperCase() + query.slice(1)} ${category} Item ${i + 1}`,
        price,
        originalPrice,
        discountPercentage,
        productUrl: `https://www.${platform.toLowerCase()}.com/product/${productId}`,
        platform: platform.charAt(0).toUpperCase() + platform.slice(1),
        imageUrl: `https://via.placeholder.com/300x300.png?text=${encodeURIComponent(platform)}+${i}`,
        rating: 3 + (i % 3), // Between 3 and 5
        ratingCount: 10 + ((queryHash + i) % 990), // Between 10 and 999
        location: 'Philippines',
        sales: 5 + ((queryHash + i) % 995), // Between 5 and 999
        source: `${platform.toLowerCase()}-fallback-generator`
      });
    }
    
    console.log(`[FallbackGenerator] Generated ${fallbackProducts.length} fallback products for ${platform}`);
    return fallbackProducts;
  }
}
