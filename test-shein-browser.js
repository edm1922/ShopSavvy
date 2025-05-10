// Simple test script for direct browser testing of Shein
const { chromium } = require('playwright');

async function testSheinBrowser() {
  console.log('=== Testing Shein Direct Browser Access ===');

  // Launch a browser in headless mode
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 }
  });

  try {
    // Create a new page
    const page = await context.newPage();

    // Navigate to Shein homepage
    console.log('Navigating to Shein homepage...');
    await page.goto('https://ph.shein.com', { waitUntil: 'domcontentloaded', timeout: 60000 });

    // Wait for the page to load
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
      console.log('Timeout waiting for network idle, continuing anyway');
    });

    // Take a screenshot of the homepage
    await page.screenshot({ path: 'shein-homepage.png' });
    console.log('Screenshot saved to shein-homepage.png');

    // Try to search for a product
    console.log('\nSearching for "dress"...');

    // Wait for the search input to be available
    await page.waitForSelector('input[type="search"], input[placeholder*="Search"], .search-input', { timeout: 10000 }).catch(() => {
      console.log('Search input not found, continuing anyway');
    });

    // Fill the search input
    await page.fill('input[type="search"], input[placeholder*="Search"], .search-input', 'dress').catch((error) => {
      console.log('Error filling search input:', error.message);
    });

    // Press Enter to search
    await page.press('input[type="search"], input[placeholder*="Search"], .search-input', 'Enter').catch((error) => {
      console.log('Error pressing Enter:', error.message);
    });

    // Wait for the search results page to load
    console.log('Waiting for search results...');
    await page.waitForTimeout(5000);

    // Take a screenshot of the search results
    await page.screenshot({ path: 'shein-search-results.png' });
    console.log('Screenshot saved to shein-search-results.png');

    // Check if we can find any product elements
    const productCount = await page.evaluate(() => {
      const products = document.querySelectorAll('.S-product-item, .product-list__item, .product-card, .goods-item, .product-item, [data-cat="goods-list"] > div');
      return products.length;
    });

    console.log(`Found ${productCount} product elements on the page`);

    // If we found products, extract some information
    if (productCount > 0) {
      console.log('\nExtracting product information...');

      const products = await page.evaluate(() => {
        const items = document.querySelectorAll('.S-product-item, .product-list__item, .product-card, .goods-item, .product-item, [data-cat="goods-list"] > div');

        return Array.from(items).slice(0, 5).map(item => {
          // Extract product information
          const titleEl = item.querySelector('.S-product-item__name, .goods-title, .product-name, h3, [class*="title"]');
          const priceEl = item.querySelector('.S-product-item__price, .goods-price, .product-price, [class*="price"]');
          const linkEl = item.querySelector('a');
          const imgEl = item.querySelector('img');

          return {
            title: titleEl ? titleEl.textContent.trim() : 'No title found',
            price: priceEl ? priceEl.textContent.trim() : 'No price found',
            url: linkEl ? linkEl.href : 'No URL found',
            image: imgEl ? imgEl.src : 'No image found'
          };
        });
      });

      console.log('\nFirst 5 products:');
      products.forEach((product, index) => {
        console.log(`\nProduct ${index + 1}:`);
        console.log(`  Title: ${product.title}`);
        console.log(`  Price: ${product.price}`);
        console.log(`  URL: ${product.url}`);
        console.log(`  Image: ${product.image ? product.image.substring(0, 50) + '...' : 'No image'}`);
      });
    } else {
      console.log('\nNo products found. This could be due to:');
      console.log('1. The search term not returning results');
      console.log('2. The selectors need to be updated');
      console.log('3. Shein might be blocking automated access with CAPTCHA');

      // Check if there's a CAPTCHA
      const hasCaptcha = await page.evaluate(() => {
        return document.body.textContent.includes('CAPTCHA') ||
               document.body.textContent.includes('captcha') ||
               document.body.textContent.includes('Please select') ||
               document.body.textContent.includes('verify') ||
               document.body.textContent.includes('Verify');
      });

      if (hasCaptcha) {
        console.log('\nCAPTCHA detected! Taking a screenshot...');
        await page.screenshot({ path: 'shein-captcha.png' });
        console.log('Screenshot saved to shein-captcha.png');
      }
    }

    // Wait for user to see the page
    console.log('\nWaiting 10 seconds before closing...');
    await new Promise(resolve => setTimeout(resolve, 10000));

  } catch (error) {
    console.error('Error testing Shein browser:', error);
  } finally {
    // Close the browser
    await browser.close();
    console.log('\n=== Shein Browser Test Completed ===');
  }
}

// Run the test
testSheinBrowser().catch(console.error);
