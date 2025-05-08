// Simple test script for the Lazada scraper
const { LazadaScraper } = require('./src/services/scrapers/lazada-scraper');

async function testLazadaScraper() {
  console.log('Testing Lazada Scraper...');
  
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
  
  console.log('\n2. Testing searchProducts with filters...');
  try {
    const query = 'smartphone';
    const filters = {
      minPrice: 5000,
      maxPrice: 20000,
      brand: 'Samsung'
    };
    
    console.log(`Searching for: ${query} with filters:`, filters);
    
    const products = await scraper.searchProducts(query, filters);
    
    console.log(`Found ${products.length} products`);
    if (products.length > 0) {
      console.log('First product:');
      console.log(JSON.stringify(products[0], null, 2));
    }
  } catch (error) {
    console.error('Error searching products with filters:', error);
  }
  
  // Note: We're skipping getProductDetails and getProductReviews tests
  // as they require valid product IDs which we don't have yet
  
  console.log('\nLazada Scraper test completed!');
}

testLazadaScraper();
