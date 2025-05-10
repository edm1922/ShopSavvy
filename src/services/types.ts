/**
 * Common types used across the application
 */

/**
 * Product interface representing a product from any platform
 */
export interface Product {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  productUrl: string;
  imageUrl: string;
  platform: string;
  rating?: number;
  ratingCount?: number;
  source?: string;
  category?: string;
  description?: string;
  brand?: string;
  isNew?: boolean;
  isBestseller?: boolean;
  isTrending?: boolean;
  reviewCount?: number;
}

/**
 * Product details interface with additional information
 */
export interface ProductDetails extends Product {
  description?: string;
  specifications?: Record<string, string>;
  variants?: ProductVariant[];
  reviews?: ProductReview[];
  relatedProducts?: Product[];
}

/**
 * Product variant interface
 */
export interface ProductVariant {
  id: string;
  name: string;
  price?: number;
  available?: boolean;
  imageUrl?: string;
}

/**
 * Product review interface
 */
export interface ProductReview {
  id: string;
  author: string;
  rating: number;
  date: string;
  content: string;
  helpful?: number;
}

/**
 * Search filters interface
 */
export interface SearchFilters {
  minPrice?: number;
  maxPrice?: number;
  brand?: string;
  category?: string;
  sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'relevance';
}

/**
 * Price history data point interface
 */
export interface PriceHistoryPoint {
  price: number;
  date: string; // ISO date string
  platform: string;
}

/**
 * Price history interface
 */
export interface PriceHistory {
  productId: string;
  productName: string;
  currentPrice: number;
  lowestPrice: number;
  highestPrice: number;
  pricePoints: PriceHistoryPoint[];
  averagePrice: number;
  priceChange: number; // Percentage change
  priceChangeDirection: 'up' | 'down' | 'stable';
}

/**
 * Price alert interface
 */
export interface PriceAlert {
  id: string;
  productId: string;
  productName: string;
  productUrl: string;
  imageUrl?: string;
  currentPrice: number;
  targetPrice: number;
  platform: string;
  isActive: boolean;
  isTriggered: boolean;
  createdAt: string;
  updatedAt: string;
}
