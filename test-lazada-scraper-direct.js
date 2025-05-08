// Direct test script for the Lazada scraper
const { LazadaScraper } = require('./src/services/scrapers/lazada-scraper');

async function testLazadaScraper() {
  console.log('Testing Lazada Scraper directly...');
  
  const scraper = new LazadaScraper();
  
  console.log('\n1. Testing searchProducts...');
  try {
    const query = 'smartphone';
    console.log(`Searching for: ${query}`);
    
    const products = await scraper.searchProducts(query);
    
    console.log(`Found ${products.length} products`);
    if (products.length > 0) {
      console.log('First product:');
      console.log(JSON.stringify(products[0], null, 2));
    }
  } catch (error) {
    console.error('Error searching products:', error);
  }
  
  console.log('\n2. Testing getProductDetails...');
  try {
    // Use a mock product ID since we don't have a real one
    const productId = 'mock-1';
    console.log(`Getting details for product: ${productId}`);
    
    const productDetails = await scraper.getProductDetails(productId);
    
    if (productDetails) {
      console.log('Product details:');
      console.log(JSON.stringify(productDetails, null, 2));
    } else {
      console.log('No product details found');
    }
  } catch (error) {
    console.error('Error getting product details:', error);
  }
  
  console.log('\n3. Testing getProductReviews...');
  try {
    // Use a mock product ID since we don't have a real one
    const productId = 'mock-1';
    console.log(`Getting reviews for product: ${productId}`);
    
    const reviews = await scraper.getProductReviews(productId);
    
    console.log(`Found ${reviews.length} reviews`);
    if (reviews.length > 0) {
      console.log('First review:');
      console.log(JSON.stringify(reviews[0], null, 2));
    }
  } catch (error) {
    console.error('Error getting product reviews:', error);
  }
  
  console.log('\nLazada Scraper test completed!');
}

testLazadaScraper();
