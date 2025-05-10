// Test script for the Shein scraper's product reviews functionality
require('dotenv').config();

// Import the SheinScraper class
const { SheinScraper } = require('./src/services/scrapers/shein-scraper');

async function testSheinReviews() {
  console.log('=== Testing Shein Product Reviews ===');
  
  // Create a new instance of the Shein scraper with debug mode enabled
  const scraper = new SheinScraper({ debug: true });
  
  try {
    // First, search for products to get a product ID
    const query = 'dress';
    console.log(`\nSearching for: "${query}" to find a product ID`);
    
    // Search for products (just 1 page for testing)
    const products = await scraper.searchProducts(query, undefined, 1);
    
    console.log(`\nFound ${products.length} products`);
    
    if (products.length > 0) {
      // Get the first product's ID
      const productId = products[0].id;
      console.log(`\nTesting reviews for product: ${productId}`);
      console.log(`Product title: ${products[0].title}`);
      console.log(`Product URL: ${products[0].productUrl}`);
      
      // Get reviews for the product
      const reviews = await scraper.getProductReviews(productId, 1);
      
      console.log(`\nFound ${reviews.length} reviews for product ${productId}`);
      
      if (reviews.length > 0) {
        console.log('\nFirst 3 reviews:');
        reviews.slice(0, 3).forEach((review, index) => {
          console.log(`\nReview ${index + 1}:`);
          console.log(`  ID: ${review.id}`);
          console.log(`  Reviewer: ${review.reviewer}`);
          console.log(`  Rating: ${review.rating}/5`);
          console.log(`  Date: ${review.date}`);
          console.log(`  Comment: ${review.comment.substring(0, 100)}${review.comment.length > 100 ? '...' : ''}`);
          if (review.images && review.images.length > 0) {
            console.log(`  Images: ${review.images.length} image(s)`);
            console.log(`  First image: ${review.images[0].substring(0, 50)}...`);
          }
          if (review.verifiedPurchase) {
            console.log(`  Verified Purchase: Yes`);
          }
        });
      } else {
        console.log('\nNo reviews found for this product. This could be due to:');
        console.log('1. The product is new and has no reviews yet');
        console.log('2. The review selectors need to be updated');
        console.log('3. Shein might be blocking automated access with CAPTCHA');
      }
    } else {
      console.log('\nNo products found to test reviews.');
    }
  } catch (error) {
    console.error('Error testing Shein reviews:', error);
  } finally {
    // Close the scraper
    await scraper.close();
    console.log('\n=== Shein Reviews Test Completed ===');
  }
}

// Run the test
testSheinReviews().catch(console.error);
