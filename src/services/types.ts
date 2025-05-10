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
