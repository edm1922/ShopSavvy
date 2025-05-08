/**
 * Types and interfaces for the web scraping system
 */

import { SearchFilters } from '../shopping-apis';

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
   * The name of the platform where the product is sold (e.g., Shopee, Lazada).
   */
  platform: string;
  /**
   * The URL of the product image.
   */
  imageUrl: string;
  /**
   * The original price before any discounts (if available).
   */
  originalPrice?: number;
  /**
   * The discount percentage (if available).
   */
  discountPercentage?: number;
  /**
   * The rating of the product (typically 0-5).
   */
  rating?: number;
  /**
   * The number of ratings the product has received.
   */
  ratingCount?: number;
  /**
   * Whether the product is in stock.
   */
  inStock?: boolean;
  /**
   * The seller or shop name.
   */
  seller?: string;
  /**
   * The location of the seller.
   */
  location?: string;
  /**
   * The shipping fee (if available).
   */
  shippingFee?: number;
  /**
   * The number of sales or orders (if available).
   */
  sales?: number;
}

/**
 * Represents detailed product information.
 */
export interface ProductDetails extends Product {
  /**
   * The description of the product.
   */
  description: string;
  /**
   * The specifications of the product.
   */
  specifications?: Record<string, string>;
  /**
   * The available variants of the product.
   */
  variants?: ProductVariant[];
  /**
   * The categories the product belongs to.
   */
  categories?: string[];
  /**
   * The brand of the product.
   */
  brand?: string;
  /**
   * The warranty information (if available).
   */
  warranty?: string;
  /**
   * The return policy (if available).
   */
  returnPolicy?: string;
}

/**
 * Represents a product variant.
 */
export interface ProductVariant {
  /**
   * The name of the variant (e.g., "Color", "Size").
   */
  name: string;
  /**
   * The value of the variant (e.g., "Red", "XL").
   */
  value: string;
  /**
   * The price of the variant (if different from the base product).
   */
  price?: number;
  /**
   * Whether the variant is in stock.
   */
  inStock?: boolean;
}

/**
 * Represents a product review.
 */
export interface ProductReview {
  /**
   * The unique identifier for the review.
   */
  id: string;
  /**
   * The name or username of the reviewer.
   */
  reviewer: string;
  /**
   * The rating given by the reviewer (typically 0-5).
   */
  rating: number;
  /**
   * The text content of the review.
   */
  comment: string;
  /**
   * The date the review was posted.
   */
  date: string;
  /**
   * URLs of images included in the review (if any).
   */
  images?: string[];
  /**
   * Whether the reviewer is a verified purchaser.
   */
  verifiedPurchase?: boolean;
}

/**
 * Interface that all platform-specific scrapers must implement.
 */
export interface ScraperInterface {
  /**
   * Searches for products based on a query and optional filters.
   *
   * @param query The search query.
   * @param filters Optional filters to apply to the search.
   * @returns A promise that resolves to an array of Product objects.
   */
  searchProducts(query: string, filters?: SearchFilters): Promise<Product[]>;

  /**
   * Gets detailed information about a specific product.
   *
   * @param productId The unique identifier of the product.
   * @returns A promise that resolves to a ProductDetails object, or null if the product is not found.
   */
  getProductDetails(productId: string): Promise<ProductDetails | null>;

  /**
   * Gets reviews for a specific product.
   *
   * @param productId The unique identifier of the product.
   * @param page The page number of reviews to fetch (for pagination).
   * @returns A promise that resolves to an array of ProductReview objects.
   */
  getProductReviews?(productId: string, page?: number): Promise<ProductReview[]>;

  /**
   * Gets products from a specific category.
   *
   * @param categoryId The unique identifier of the category.
   * @param page The page number of products to fetch (for pagination).
   * @returns A promise that resolves to an array of Product objects.
   */
  getCategoryProducts?(categoryId: string, page?: number): Promise<Product[]>;

  /**
   * Closes any resources used by the scraper.
   * This should be called when the scraper is no longer needed.
   *
   * @returns A promise that resolves when the resources have been closed.
   */
  close?(): Promise<void>;
}

/**
 * Error class for scraper-related errors.
 */
export class ScraperError extends Error {
  constructor(
    message: string,
    public readonly platform: string,
    public readonly url?: string,
    public readonly statusCode?: number,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'ScraperError';
  }
}
