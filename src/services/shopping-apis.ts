/**
 * Represents a product with its key attributes.
 */
export interface Product {
  /**
   * The unique identifier for the product.
   */
  id: string;
  /**
   * The title or name of the product.
   */
  title: string;
  /**
   * The price of the product.
   */
  price: number;
  /**
   * The URL of the product on the e-commerce platform.
   */
  productUrl: string;
  /**
   * The name of the platform where the product is sold (e.g., Amazon, Shopee).
   */
  platform: string;
  /**
   * The URL of the product image.
   */
  imageUrl: string;
}

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
  console.log(`Searching for: ${query}`, filters);
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));

  if (!query.trim()) {
    return [];
  }

  const lowerQuery = query.toLowerCase();
  const results = mockProducts.filter(product => 
    product.title.toLowerCase().includes(lowerQuery) ||
    product.platform.toLowerCase().includes(lowerQuery)
  );

  // If specific filters are provided, apply them (basic example)
  let filteredResults = results;
  if (filters) {
    if (filters.category) {
      // Mock: assuming category might be in title
      filteredResults = filteredResults.filter(p => p.title.toLowerCase().includes(filters.category!.toLowerCase()));
    }
    if (filters.minPrice) {
      filteredResults = filteredResults.filter(p => p.price >= filters.minPrice!);
    }
    if (filters.maxPrice) {
      filteredResults = filteredResults.filter(p => p.price <= filters.maxPrice!);
    }
    if (filters.brand) {
      // Mock: assuming brand might be in title or platform
      filteredResults = filteredResults.filter(p => p.title.toLowerCase().includes(filters.brand!.toLowerCase()) || p.platform.toLowerCase().includes(filters.brand!.toLowerCase()));
    }
  }
  
  return filteredResults.length > 0 ? filteredResults : mockProducts.slice(0, Math.floor(mockProducts.length / 2));
}

