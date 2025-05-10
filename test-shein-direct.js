// Import required modules
require('dotenv').config();
const { SheinScraper } = require('./dist/services/scrapers/shein-scraper');

async function testSheinScraper() {
  console.log('=== Testing Shein Scraper ===');
  
  // Create a new instance of the Shein scraper
  const scraper = new SheinScraper({ debug: true });
  
  try {
    // Test with a simple query
    const query = 'dress';
    console.log(`\nSearching for: "${query}"`);
    
    // Search for products (just 1 page for testing)
    const products = await scraper.searchProducts(query, undefined, 1);
    
    console.log(`\nFound ${products.length} products`);
    
    if (products.length > 0) {
      console.log('\nFirst 3 products:');
      products.slice(0, 3).forEach((product, index) => {
        console.log(`\nProduct ${index + 1}:`);
        console.log(`  Title: ${product.title}`);
        console.log(`  Price: ${product.price}`);
        console.log(`  URL: ${product.productUrl}`);
        console.log(`  Image: ${product.imageUrl ? product.imageUrl.substring(0, 50) + '...' : 'No image'}`);
      });
    } else {
      console.log('\nNo products found. This could be due to:');
      console.log('1. The search term not returning results');
      console.log('2. The scraper selectors need to be updated');
      console.log('3. Shein might be blocking automated access with CAPTCHA');
    }
  } catch (error) {
    console.error('Error testing Shein scraper:', error);
  } finally {
    // Close the scraper
    await scraper.close();
    console.log('\n=== Shein Scraper Test Completed ===');
  }
}

// Run the test
testSheinScraper().catch(console.error);
