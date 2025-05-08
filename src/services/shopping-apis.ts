/**
 * Re-export the Product interface from the scrapers module.
 */
export { Product, ProductDetails, ProductReview } from './scrapers/types';

/**
 * Represents search filters that can be applied to product searches.
 */
export interface SearchFilters {
  /**
   * The category of the product.
   */
  category?: string;
  /**
   * The minimum price of the product.
   */
  minPrice?: number;
  /**
   * The maximum price of the product.
   */
  maxPrice?: number;
  /**
   * The brand of the product.
   */
  brand?: string;
  /**
   * The minimum rating of the product (1-5).
   */
  minRating?: number;
}

const mockProducts: Product[] = [
  { id: '1', title: 'Modern Red Running Shoes', price: 49.99, productUrl: 'https://example.com/product/1', platform: 'Amazon', imageUrl: 'https://picsum.photos/seed/product1/400/300' },
  { id: '2', title: 'Classic Blue Denim Jeans', price: 35.50, productUrl: 'https://example.com/product/2', platform: 'Shopee', imageUrl: 'https://picsum.photos/seed/product2/400/300' },
  { id: '3', title: 'Ergonomic Office Chair', price: 120.00, productUrl: 'https://example.com/product/3', platform: 'Lazada', imageUrl: 'https://picsum.photos/seed/product3/400/300' },
  { id: '4', title: 'Wireless Bluetooth Headphones', price: 79.90, productUrl: 'https://example.com/product/4', platform: 'eBay', imageUrl: 'https://picsum.photos/seed/product4/400/300' },
  { id: '5', title: 'Stainless Steel Kitchen Knife Set', price: 65.00, productUrl: 'https://example.com/product/5', platform: 'Walmart', imageUrl: 'https://picsum.photos/seed/product5/400/300' },
  { id: '6', title: 'Organic Cotton T-Shirt (White)', price: 19.99, productUrl: 'https://example.com/product/6', platform: 'Amazon', imageUrl: 'https://picsum.photos/seed/product6/400/300' },
  { id: '7', title: 'Smart Home Security Camera', price: 89.00, productUrl: 'https://example.com/product/7', platform: 'BestBuy', imageUrl: 'https://picsum.photos/seed/product7/400/300' },
  { id: '8', title: 'Yoga Mat Premium Non-Slip', price: 29.75, productUrl: 'https://example.com/product/8', platform: 'Target', imageUrl: 'https://picsum.photos/seed/product8/400/300' },
];

/**
 * Asynchronously searches for products based on a query and optional filters.
 *
 * @param query The search query.
 * @param filters Optional filters to apply to the search.
 * @returns A promise that resolves to an array of Product objects matching the search criteria.
 */
export async function searchProducts(query: string, filters?: SearchFilters): Promise<Product[]> {
  console.log(`[shopping-apis] Searching for: ${query}`, filters);

  if (!query.trim()) {
    console.log('[shopping-apis] Empty query, returning empty results');
    return [];
  }

  try {
    // Import the universal search service
    console.log('[shopping-apis] Importing universal search service');
    const UniversalSearch = await import('./search/universal-search');

    // Get default platforms
    const defaultPlatforms = ['Shopee', 'Lazada'];

    // Get enabled platforms from environment or use defaults
    const platforms = process.env.NEXT_PUBLIC_ENABLED_PLATFORMS
      ? process.env.NEXT_PUBLIC_ENABLED_PLATFORMS.split(',')
      : defaultPlatforms;

    console.log(`[shopping-apis] Using platforms: ${platforms.join(', ')}`);

    // Use the universal search service with Serper.dev API
    console.log('[shopping-apis] Calling universal search service');
    const results = await UniversalSearch.searchProducts(query, filters, {
      platformFilter: platforms,
    });

    console.log(`[shopping-apis] Got ${results.length} results from universal search`);

    // If no results, try with mock data
    if (results.length === 0) {
      console.log('[shopping-apis] No results from universal search, falling back to mock data');
      return getMockProducts(query, filters);
    }

    return results;
  } catch (error) {
    console.error('[shopping-apis] Error searching products:', error);
    // Fall back to mock data in case of error
    console.log('[shopping-apis] Falling back to mock data due to error');
    return getMockProducts(query, filters);
  }
}

/**
 * Gets mock products based on a query and optional filters.
 * This is used as a fallback when real scraping is disabled or fails.
 *
 * @param query The search query.
 * @param filters Optional filters to apply to the search.
 * @returns An array of Product objects matching the search criteria.
 */
function getMockProducts(query: string, filters?: SearchFilters): Product[] {
  const lowerQuery = query.toLowerCase();
  const results = mockProducts.filter(product =>
    product.title.toLowerCase().includes(lowerQuery) ||
    product.platform.toLowerCase().includes(lowerQuery)
  );

  // If specific filters are provided, apply them
  let filteredResults = results;
  if (filters) {
    if (filters.category) {
      filteredResults = filteredResults.filter(p => p.title.toLowerCase().includes(filters.category!.toLowerCase()));
    }
    if (filters.minPrice) {
      filteredResults = filteredResults.filter(p => p.price >= filters.minPrice!);
    }
    if (filters.maxPrice) {
      filteredResults = filteredResults.filter(p => p.price <= filters.maxPrice!);
    }
    if (filters.brand) {
      filteredResults = filteredResults.filter(p => p.title.toLowerCase().includes(filters.brand!.toLowerCase()) || p.platform.toLowerCase().includes(filters.brand!.toLowerCase()));
    }
    if (filters.minRating) {
      filteredResults = filteredResults.filter(p => (p.rating || 0) >= filters.minRating!);
    }
  }

  return filteredResults.length > 0 ? filteredResults : mockProducts.slice(0, Math.floor(mockProducts.length / 2));
}

