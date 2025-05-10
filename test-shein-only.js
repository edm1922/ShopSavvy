// Simple test script for the Shein scraper
const { chromium } = require('playwright');

// Import the Shein scraper
const { SheinScraper } = require('./src/services/scrapers/shein-scraper');

async function testSheinScraper() {
  console.log('=== Testing Shein Scraper ===');
  
  // Create a new instance of the Shein scraper with debug mode enabled
  const scraper = new SheinScraper({ debug: true });
  
  try {
    // Test with a simple query
    const query = 'dress';
    console.log(`\nSearching for: "${query}"`);
    
    // Set a lower page count for testing (just 1 page)
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
        console.log(`  Source: ${product.source || 'direct'}`);
      });
    } else {
      console.log('\nNo products found. This could be due to:');
      console.log('1. The search term not returning results');
      console.log('2. The scraper selectors need to be updated');
      console.log('3. Shein might be blocking automated access');
      
      // Try a different approach - direct URL access
      console.log('\nTrying direct URL access to Shein...');
      const browser = await chromium.launch({ headless: false });
      const context = await browser.newContext();
      const page = await context.newPage();
      
      await page.goto('https://ph.shein.com', { waitUntil: 'domcontentloaded' });
      console.log('Navigated to Shein homepage');
      
      // Wait for user to see the page
      console.log('Waiting 10 seconds to see if the page loads correctly...');
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      // Take a screenshot
      await page.screenshot({ path: 'shein-homepage.png' });
      console.log('Screenshot saved to shein-homepage.png');
      
      // Try to search
      try {
        console.log('Trying to search for "dress" directly on the page...');
        await page.fill('input[type="search"]', 'dress');
        await page.press('input[type="search"]', 'Enter');
        
        // Wait for results page
        await page.waitForTimeout(5000);
        
        // Take a screenshot of the results page
        await page.screenshot({ path: 'shein-search-results.png' });
        console.log('Screenshot saved to shein-search-results.png');
        
        // Check if we can find any product elements
        const productCount = await page.evaluate(() => {
          const products = document.querySelectorAll('.S-product-item, .product-list__item, .product-card, .goods-item');
          return products.length;
        });
        
        console.log(`Found ${productCount} product elements on the page`);
      } catch (error) {
        console.error('Error during manual search:', error);
      }
      
      await browser.close();
    }
  } catch (error) {
    console.error('Error testing Shein scraper:', error);
  } finally {
    // Close the scraper
    await scraper.close();
  }
  
  console.log('\n=== Shein Scraper Test Completed ===');
}

// Run the test
testSheinScraper().catch(console.error);
