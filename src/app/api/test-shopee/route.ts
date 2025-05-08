import { NextResponse } from 'next/server';
import { getScraperForPlatform } from '@/services/scrapers/scraper-factory';
import { ShopeeScraper } from '@/services/scrapers/shopee-scraper';

export async function GET() {
  let scraper: ShopeeScraper | null = null;

  try {
    console.log('Testing Shopee Scraper...');

    // Get the Shopee scraper
    scraper = getScraperForPlatform('shopee') as ShopeeScraper;

    // Test search products
    console.log('Testing searchProducts...');
    const query = 'smartphone';
    const products = await scraper.searchProducts(query);

    console.log(`Found ${products.length} products`);

    // Test product details
    console.log('Testing getProductDetails...');
    let productDetails = null;
    let productId = '';

    if (products.length > 0) {
      productId = products[0].id;
      console.log(`Getting details for product: ${productId}`);
      productDetails = await scraper.getProductDetails(productId);
    } else {
      // Use a known Shopee product ID for testing (format: "shopId_itemId")
      productId = '123456_7890123';
      console.log(`No products found, using known product ID: ${productId}`);
      productDetails = await scraper.getProductDetails(productId);
    }

    // Test product reviews
    console.log('Testing getProductReviews...');
    let reviews = [];

    if (productDetails) {
      console.log(`Getting reviews for product: ${productId}`);
      reviews = await scraper.getProductReviews(productId);
    } else if (products.length > 0) {
      productId = products[0].id;
      console.log(`Getting reviews for product: ${productId}`);
      reviews = await scraper.getProductReviews(productId);
    } else {
      // Use a known Shopee product ID for testing (format: "shopId_itemId")
      productId = '123456_7890123';
      console.log(`Using known product ID for reviews: ${productId}`);
      reviews = await scraper.getProductReviews(productId);
    }

    console.log('Shopee Scraper test completed!');

    // Return the results
    return NextResponse.json({
      success: true,
      products: products.slice(0, 3), // Only return the first 3 products to keep the response size reasonable
      productDetails,
      reviews: reviews.slice(0, 3), // Only return the first 3 reviews
      screenshots: {
        search: 'shopee-search-debug.png',
        product: productId ? `shopee-product-${productId}-debug.png` : '',
        reviews: productId ? `shopee-reviews-${productId}-page1-debug.png` : ''
      }
    });
  } catch (error) {
    console.error('Error testing Shopee scraper:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  } finally {
    // Make sure to close the browser
    if (scraper) {
      try {
        await scraper.close();
      } catch (error) {
        console.error('Error closing Shopee scraper:', error);
      }
    }
  }
}
