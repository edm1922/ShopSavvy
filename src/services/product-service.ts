/**
 * Unified service for product operations across multiple platforms.
 */

import { Product, ProductDetails, ProductReview } from './types';
import { getAllScrapers, getScraperForPlatform, getSupportedPlatforms } from './scrapers/scraper-factory';
import { SearchFilters } from './shopping-apis';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

/**
 * Service for product operations across multiple platforms.
 */
export class ProductService {
  /**
   * Searches for products across all supported platforms.
   *
   * @param query The search query.
   * @param filters Optional filters to apply to the search.
   * @returns A promise that resolves to an array of Product objects from all platforms.
   */
  async searchAcrossPlatforms(query: string, filters?: SearchFilters): Promise<Product[]> {
    // In the browser, use the API
    if (isBrowser) {
      return this.searchViaApi(query, getSupportedPlatforms(), filters);
    }

    // On the server, use the scrapers directly
    const scrapers = getAllScrapers();
    const searchPromises = scrapers.map(scraper => scraper.searchProducts(query, filters));

    try {
      const results = await Promise.all(searchPromises);
      return results.flat();
    } catch (error) {
      console.error('Error searching across platforms:', error);
      return [];
    }
  }

  /**
   * Searches for products on specific platforms.
   *
   * @param query The search query.
   * @param platforms The platforms to search on.
   * @param filters Optional filters to apply to the search.
   * @returns A promise that resolves to an array of Product objects from the specified platforms.
   */
  async searchOnPlatforms(query: string, platforms: string[], filters?: SearchFilters): Promise<Product[]> {
    // In the browser, use the API
    if (isBrowser) {
      return this.searchViaApi(query, platforms, filters);
    }

    // On the server, use the scrapers directly
    const searchPromises = platforms.map(platform => {
      try {
        const scraper = getScraperForPlatform(platform);
        return scraper.searchProducts(query, filters);
      } catch (error) {
        console.error(`Error getting scraper for platform ${platform}:`, error);
        return Promise.resolve<Product[]>([]);
      }
    });

    try {
      const results = await Promise.all(searchPromises);
      return results.flat();
    } catch (error) {
      console.error('Error searching on platforms:', error);
      return [];
    }
  }

  /**
   * Searches for products via the API.
   * This is used in the browser to avoid bundling server-only code.
   *
   * @param query The search query.
   * @param platforms The platforms to search on.
   * @param filters Optional filters to apply to the search.
   * @returns A promise that resolves to an array of Product objects.
   */
  private async searchViaApi(query: string, platforms: string[], filters?: SearchFilters): Promise<Product[]> {
    try {
      // Build the URL with query parameters
      const url = new URL('/api/search', window.location.origin);
      url.searchParams.append('query', query);
      url.searchParams.append('platforms', platforms.join(','));

      // Add filters if provided
      if (filters) {
        if (filters.minPrice) url.searchParams.append('minPrice', filters.minPrice.toString());
        if (filters.maxPrice) url.searchParams.append('maxPrice', filters.maxPrice.toString());
        if (filters.brand) url.searchParams.append('brand', filters.brand);
        if (filters.minRating) url.searchParams.append('minRating', filters.minRating.toString());
        if (filters.platform) url.searchParams.append('platform', filters.platform);
      }

      // Make the API request
      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Unknown API error');
      }

      return data.results || [];
    } catch (error) {
      console.error('Error searching via API:', error);
      return [];
    }
  }

  /**
   * Gets detailed information about a specific product.
   *
   * @param productId The unique identifier of the product.
   * @param platform The platform the product is on.
   * @returns A promise that resolves to a ProductDetails object, or null if the product is not found.
   */
  async getProductDetails(productId: string, platform: string): Promise<ProductDetails | null> {
    // In the browser, use the API
    if (isBrowser) {
      return this.getProductDetailsViaApi(productId, platform);
    }

    // On the server, use the scrapers directly
    try {
      const scraper = getScraperForPlatform(platform);
      return await scraper.getProductDetails(productId);
    } catch (error) {
      console.error(`Error getting product details for ${productId} on ${platform}:`, error);
      return null;
    }
  }

  /**
   * Gets detailed information about a specific product via the API.
   * This is used in the browser to avoid bundling server-only code.
   *
   * @param productId The unique identifier of the product.
   * @param platform The platform the product is on.
   * @returns A promise that resolves to a ProductDetails object, or null if the product is not found.
   */
  private async getProductDetailsViaApi(productId: string, platform: string): Promise<ProductDetails | null> {
    try {
      // Build the URL with query parameters
      const url = new URL('/api/product', window.location.origin);
      url.searchParams.append('id', productId);
      url.searchParams.append('platform', platform);

      // Make the API request
      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Unknown API error');
      }

      return data.product || null;
    } catch (error) {
      console.error(`Error getting product details via API for ${productId} on ${platform}:`, error);
      return null;
    }
  }

  /**
   * Gets reviews for a specific product.
   *
   * @param productId The unique identifier of the product.
   * @param platform The platform the product is on.
   * @param page The page number of reviews to fetch (for pagination).
   * @returns A promise that resolves to an array of ProductReview objects.
   */
  async getProductReviews(productId: string, platform: string, page: number = 1): Promise<ProductReview[]> {
    // In the browser, use the API
    if (isBrowser) {
      return this.getProductReviewsViaApi(productId, platform, page);
    }

    // On the server, use the scrapers directly
    try {
      const scraper = getScraperForPlatform(platform);

      if (scraper.getProductReviews) {
        return await scraper.getProductReviews(productId, page);
      } else {
        console.warn(`Platform ${platform} does not support getting product reviews.`);
        return [];
      }
    } catch (error) {
      console.error(`Error getting product reviews for ${productId} on ${platform}:`, error);
      return [];
    }
  }

  /**
   * Gets reviews for a specific product via the API.
   * This is used in the browser to avoid bundling server-only code.
   *
   * @param productId The unique identifier of the product.
   * @param platform The platform the product is on.
   * @param page The page number of reviews to fetch (for pagination).
   * @returns A promise that resolves to an array of ProductReview objects.
   */
  private async getProductReviewsViaApi(productId: string, platform: string, page: number = 1): Promise<ProductReview[]> {
    try {
      // Build the URL with query parameters
      const url = new URL('/api/reviews', window.location.origin);
      url.searchParams.append('id', productId);
      url.searchParams.append('platform', platform);
      url.searchParams.append('page', page.toString());

      // Make the API request
      const response = await fetch(url.toString());

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Unknown API error');
      }

      return data.reviews || [];
    } catch (error) {
      console.error(`Error getting product reviews via API for ${productId} on ${platform}:`, error);
      return [];
    }
  }

  /**
   * Gets the names of all supported platforms.
   *
   * @returns An array of platform names.
   */
  getSupportedPlatforms(): string[] {
    return getSupportedPlatforms();
  }

  /**
   * Compares products across platforms.
   *
   * @param query The search query.
   * @param filters Optional filters to apply to the search.
   * @returns A promise that resolves to an array of Product objects, sorted by price.
   */
  async compareProducts(query: string, filters?: SearchFilters): Promise<Product[]> {
    // In the browser, use the API with sort parameter
    if (isBrowser) {
      try {
        // Build the URL with query parameters
        const url = new URL('/api/compare', window.location.origin);
        url.searchParams.append('query', query);
        url.searchParams.append('platforms', getSupportedPlatforms().join(','));

        // Add filters if provided
        if (filters) {
          if (filters.minPrice) url.searchParams.append('minPrice', filters.minPrice.toString());
          if (filters.maxPrice) url.searchParams.append('maxPrice', filters.maxPrice.toString());
          if (filters.brand) url.searchParams.append('brand', filters.brand);
          if (filters.minRating) url.searchParams.append('minRating', filters.minRating.toString());
          if (filters.platform) url.searchParams.append('platform', filters.platform);
        }

        // Make the API request
        const response = await fetch(url.toString());

        if (!response.ok) {
          throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || 'Unknown API error');
        }

        return data.results || [];
      } catch (error) {
        console.error('Error comparing products via API:', error);
        return [];
      }
    }

    // On the server, use the scrapers directly
    const products = await this.searchAcrossPlatforms(query, filters);

    // Sort by price (lowest first)
    return products.sort((a, b) => a.price - b.price);
  }
}
