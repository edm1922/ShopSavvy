// Test script for the enhanced Shein scraper with CAPTCHA bypassing
// Use ESM syntax
import dotenv from 'dotenv';
dotenv.config();

// Import the SheinScraper class directly from the source file
// We need to use a dynamic import since it's a TypeScript file
async function importSheinScraper() {
  try {
    // Try different import paths
    try {
      return await import('./src/services/scrapers/shein-scraper');
    } catch (e) {
      console.log('Failed to import from ./src/services/scrapers/shein-scraper:', e.message);
      try {
        return await import('./services/scrapers/shein-scraper');
      } catch (e) {
        console.log('Failed to import from ./services/scrapers/shein-scraper:', e.message);
        return await import('./dist/services/scrapers/shein-scraper');
      }
    }
  } catch (error) {
    console.error('Error importing SheinScraper:', error);
    throw error;
  }
}

async function testEnhancedSheinScraper() {
  console.log('=== Testing Enhanced Shein Scraper with CAPTCHA Bypassing ===');

  // Import the SheinScraper class
  const { SheinScraper } = await importSheinScraper();
  console.log('Successfully imported SheinScraper');

  // Create a new instance of the Shein scraper with debug mode enabled
  const scraper = new SheinScraper({ debug: true });

  try {
    // Test with a simple query
    const query = 'dress';
    console.log(`\nSearching for: "${query}"`);

    // Search for products (just 1 page for testing)
    const products = await scraper.searchProducts(query, undefined, 1);

    console.log(`\nFound ${products.length} products`);

    if (products.length > 0) {
      console.log('\nFirst 5 products:');
      products.slice(0, 5).forEach((product, index) => {
        console.log(`\nProduct ${index + 1}:`);
        console.log(`  ID: ${product.id}`);
        console.log(`  Title: ${product.title}`);
        console.log(`  Price: ${product.price}`);
        if (product.originalPrice) {
          console.log(`  Original Price: ${product.originalPrice}`);
        }
        if (product.discountPercentage) {
          console.log(`  Discount: ${product.discountPercentage}%`);
        }
        console.log(`  URL: ${product.productUrl}`);
        console.log(`  Image: ${product.imageUrl ? product.imageUrl.substring(0, 50) + '...' : 'No image'}`);
        console.log(`  Source: ${product.source}`);
      });

      // Test product details for the first product
      console.log('\n=== Testing Product Details ===');
      const firstProduct = products[0];
      console.log(`Getting details for product: ${firstProduct.id}`);

      const productDetails = await scraper.getProductDetails(firstProduct.id);

      if (productDetails) {
        console.log('\nProduct Details:');
        console.log(`  ID: ${productDetails.id}`);
        console.log(`  Title: ${productDetails.title}`);
        console.log(`  Price: ${productDetails.price}`);
        if (productDetails.originalPrice) {
          console.log(`  Original Price: ${productDetails.originalPrice}`);
        }
        if (productDetails.discountPercentage) {
          console.log(`  Discount: ${productDetails.discountPercentage}%`);
        }
        console.log(`  URL: ${productDetails.productUrl}`);
        console.log(`  Image: ${productDetails.imageUrl ? productDetails.imageUrl.substring(0, 50) + '...' : 'No image'}`);
        console.log(`  Description: ${productDetails.description ? productDetails.description.substring(0, 100) + '...' : 'No description'}`);
      } else {
        console.log('\nFailed to get product details');
      }
    } else {
      console.log('\nNo products found. This could be due to:');
      console.log('1. The search term not returning results');
      console.log('2. The scraper selectors need to be updated');
      console.log('3. Shein might be blocking automated access despite CAPTCHA bypassing');
    }
  } catch (error) {
    console.error('Error testing Shein scraper:', error);
  } finally {
    // Close the scraper
    await scraper.close();
    console.log('\n=== Enhanced Shein Scraper Test Completed ===');
  }
}

// Run the test as the main module
if (import.meta.url === import.meta.main) {
  testEnhancedSheinScraper().catch(console.error);
}

// Export the test function
export { testEnhancedSheinScraper };
