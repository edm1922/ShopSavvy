/**
 * Test suite for the scrapers.
 * 
 * This file contains tests for the Shopee and Lazada scrapers.
 */

import { getScraperForPlatform } from '@/services/scrapers/scraper-factory';
import { ShopeeScraper } from '@/services/scrapers/shopee-scraper';
import { LazadaScraper } from '@/services/scrapers/lazada-scraper';
import { Product, ProductDetails, ProductReview } from '@/services/scrapers/types';

/**
 * Tests the search functionality of a scraper.
 * 
 * @param platform The platform to test.
 * @param query The search query.
 * @returns A promise that resolves when the test is complete.
 */
async function testSearch(platform: string, query: string): Promise<void> {
  console.log(`Testing ${platform} search for "${query}"...`);
  
  const scraper = getScraperForPlatform(platform);
  
  try {
    const products = await scraper.searchProducts(query);
    
    console.log(`Found ${products.length} products`);
    
    if (products.length > 0) {
      console.log('First product:');
      console.log(JSON.stringify(products[0], null, 2));
      
      // Validate product structure
      validateProduct(products[0]);
    }
    
    console.log(`${platform} search test passed!`);
  } catch (error) {
    console.error(`${platform} search test failed:`, error);
    throw error;
  }
}

/**
 * Tests the product details functionality of a scraper.
 * 
 * @param platform The platform to test.
 * @param productId The product ID to test.
 * @returns A promise that resolves when the test is complete.
 */
async function testProductDetails(platform: string, productId: string): Promise<void> {
  console.log(`Testing ${platform} product details for "${productId}"...`);
  
  const scraper = getScraperForPlatform(platform);
  
  try {
    const productDetails = await scraper.getProductDetails(productId);
    
    if (productDetails) {
      console.log('Product details:');
      console.log(JSON.stringify(productDetails, null, 2));
      
      // Validate product details structure
      validateProductDetails(productDetails);
      
      console.log(`${platform} product details test passed!`);
    } else {
      console.log(`No product details found for ${productId}`);
      console.log(`${platform} product details test skipped.`);
    }
  } catch (error) {
    console.error(`${platform} product details test failed:`, error);
    throw error;
  }
}

/**
 * Tests the product reviews functionality of a scraper.
 * 
 * @param platform The platform to test.
 * @param productId The product ID to test.
 * @returns A promise that resolves when the test is complete.
 */
async function testProductReviews(platform: string, productId: string): Promise<void> {
  console.log(`Testing ${platform} product reviews for "${productId}"...`);
  
  const scraper = getScraperForPlatform(platform);
  
  try {
    const reviews = await scraper.getProductReviews(productId);
    
    console.log(`Found ${reviews.length} reviews`);
    
    if (reviews.length > 0) {
      console.log('First review:');
      console.log(JSON.stringify(reviews[0], null, 2));
      
      // Validate review structure
      validateProductReview(reviews[0]);
    }
    
    console.log(`${platform} product reviews test passed!`);
  } catch (error) {
    console.error(`${platform} product reviews test failed:`, error);
    throw error;
  }
}

/**
 * Validates a product object.
 * 
 * @param product The product to validate.
 * @throws An error if the product is invalid.
 */
function validateProduct(product: Product): void {
  // Check required fields
  if (!product.id) throw new Error('Product ID is required');
  if (!product.title) throw new Error('Product title is required');
  if (typeof product.price !== 'number') throw new Error('Product price must be a number');
  if (!product.productUrl) throw new Error('Product URL is required');
  if (!product.platform) throw new Error('Product platform is required');
  
  // Check field types
  if (typeof product.id !== 'string') throw new Error('Product ID must be a string');
  if (typeof product.title !== 'string') throw new Error('Product title must be a string');
  if (typeof product.productUrl !== 'string') throw new Error('Product URL must be a string');
  if (typeof product.platform !== 'string') throw new Error('Product platform must be a string');
  
  // Check optional fields
  if (product.originalPrice !== undefined && typeof product.originalPrice !== 'number') {
    throw new Error('Product original price must be a number');
  }
  if (product.discountPercentage !== undefined && typeof product.discountPercentage !== 'number') {
    throw new Error('Product discount percentage must be a number');
  }
  if (product.rating !== undefined && typeof product.rating !== 'number') {
    throw new Error('Product rating must be a number');
  }
  if (product.ratingCount !== undefined && typeof product.ratingCount !== 'number') {
    throw new Error('Product rating count must be a number');
  }
}

/**
 * Validates a product details object.
 * 
 * @param productDetails The product details to validate.
 * @throws An error if the product details are invalid.
 */
function validateProductDetails(productDetails: ProductDetails): void {
  // Check required fields
  if (!productDetails.id) throw new Error('Product details ID is required');
  if (!productDetails.title) throw new Error('Product details title is required');
  if (typeof productDetails.price !== 'number') throw new Error('Product details price must be a number');
  if (!productDetails.productUrl) throw new Error('Product details URL is required');
  if (!productDetails.platform) throw new Error('Product details platform is required');
  
  // Check field types
  if (typeof productDetails.id !== 'string') throw new Error('Product details ID must be a string');
  if (typeof productDetails.title !== 'string') throw new Error('Product details title must be a string');
  if (typeof productDetails.productUrl !== 'string') throw new Error('Product details URL must be a string');
  if (typeof productDetails.platform !== 'string') throw new Error('Product details platform must be a string');
  
  // Check optional fields
  if (productDetails.description !== undefined && typeof productDetails.description !== 'string') {
    throw new Error('Product details description must be a string');
  }
  if (productDetails.brand !== undefined && typeof productDetails.brand !== 'string') {
    throw new Error('Product details brand must be a string');
  }
  if (productDetails.originalPrice !== undefined && typeof productDetails.originalPrice !== 'number') {
    throw new Error('Product details original price must be a number');
  }
  if (productDetails.discountPercentage !== undefined && typeof productDetails.discountPercentage !== 'number') {
    throw new Error('Product details discount percentage must be a number');
  }
  if (productDetails.rating !== undefined && typeof productDetails.rating !== 'number') {
    throw new Error('Product details rating must be a number');
  }
  if (productDetails.ratingCount !== undefined && typeof productDetails.ratingCount !== 'number') {
    throw new Error('Product details rating count must be a number');
  }
}

/**
 * Validates a product review object.
 * 
 * @param review The product review to validate.
 * @throws An error if the product review is invalid.
 */
function validateProductReview(review: ProductReview): void {
  // Check required fields
  if (!review.id) throw new Error('Product review ID is required');
  if (!review.reviewer) throw new Error('Product review reviewer is required');
  if (typeof review.rating !== 'number') throw new Error('Product review rating must be a number');
  if (!review.comment) throw new Error('Product review comment is required');
  if (!review.date) throw new Error('Product review date is required');
  
  // Check field types
  if (typeof review.id !== 'string') throw new Error('Product review ID must be a string');
  if (typeof review.reviewer !== 'string') throw new Error('Product review reviewer must be a string');
  if (typeof review.comment !== 'string') throw new Error('Product review comment must be a string');
  if (typeof review.date !== 'string') throw new Error('Product review date must be a string');
  
  // Check optional fields
  if (review.images !== undefined && !Array.isArray(review.images)) {
    throw new Error('Product review images must be an array');
  }
  if (review.verifiedPurchase !== undefined && typeof review.verifiedPurchase !== 'boolean') {
    throw new Error('Product review verified purchase must be a boolean');
  }
}

/**
 * Runs all tests for a platform.
 * 
 * @param platform The platform to test.
 * @param productId The product ID to test.
 * @returns A promise that resolves when all tests are complete.
 */
async function runTests(platform: string, productId: string): Promise<void> {
  console.log(`Running tests for ${platform}...`);
  
  try {
    // Test search
    await testSearch(platform, 'smartphone');
    
    // Test product details
    await testProductDetails(platform, productId);
    
    // Test product reviews
    await testProductReviews(platform, productId);
    
    console.log(`All ${platform} tests passed!`);
  } catch (error) {
    console.error(`${platform} tests failed:`, error);
  } finally {
    // Close the scraper if it has a close method
    const scraper = getScraperForPlatform(platform);
    if (typeof scraper.close === 'function') {
      await scraper.close();
    }
  }
}

/**
 * Main function to run all tests.
 */
async function main(): Promise<void> {
  console.log('Running scraper tests...');
  
  // Test Lazada
  await runTests('lazada', 'i2269770954-s10265173889');
  
  // Test Shopee
  await runTests('shopee', '123456_7890123');
  
  console.log('All tests completed!');
}

// Run the tests
main().catch(console.error);
