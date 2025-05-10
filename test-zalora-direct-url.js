const puppeteer = require('puppeteer');

/**
 * Test script to verify direct URL approach for Zalora products
 */
async function testZaloraDirectUrl() {
  console.log('Starting Zalora direct URL test...');

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--window-size=1366,768']
  });

  try {
    const page = await browser.newPage();

    // Test search URL
    const searchQuery = 'shoes';
    console.log(`Testing search URL for query: ${searchQuery}`);
    await page.goto(`https://www.zalora.com.ph/search?q=${searchQuery}`, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // Wait for a moment to see the search results
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Extract the number of items found
    const itemsFoundText = await page.evaluate(() => {
      const element = document.querySelector('div[data-testid="searchResultsHeader"] span');
      return element ? element.textContent : null;
    });

    console.log(`Items found: ${itemsFoundText}`);

    // Test direct product URLs
    console.log('\nTesting direct product URLs:');

    // Common shoe brands for constructing direct URLs
    const shoeBrands = [
      'nike', 'adidas', 'puma', 'reebok', 'new-balance'
    ];

    // Test brand-specific product URLs
    for (const brand of shoeBrands) {
      const productUrl = `https://www.zalora.com.ph/p/${brand}-${searchQuery}-1001`;
      console.log(`Testing URL: ${productUrl}`);

      await page.goto(productUrl, {
        waitUntil: 'networkidle2',
        timeout: 60000
      });

      // Check if we landed on a product page or search results
      const isProductPage = await page.evaluate(() => {
        // Check for product page elements
        const productTitle = document.querySelector('h1[data-testid="product-name"]');
        const productPrice = document.querySelector('div[data-testid="product-price"]');

        return {
          isProduct: !!productTitle || !!productPrice,
          title: productTitle ? productTitle.textContent : 'Not found',
          price: productPrice ? productPrice.textContent : 'Not found'
        };
      });

      if (isProductPage.isProduct) {
        console.log(`✅ Found product: ${isProductPage.title} - ${isProductPage.price}`);
      } else {
        console.log(`❌ Not a product page, redirected to search results`);
      }

      // Wait a moment before trying the next URL
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Test shoe type URLs
    const shoeTypes = [
      'sneakers', 'running-shoes', 'casual-shoes', 'formal-shoes', 'boots'
    ];

    console.log('\nTesting shoe type URLs:');

    for (const type of shoeTypes) {
      const productUrl = `https://www.zalora.com.ph/p/zalora-${type}-2001`;
      console.log(`Testing URL: ${productUrl}`);

      await page.goto(productUrl, {
        waitUntil: 'networkidle2',
        timeout: 60000
      });

      // Check if we landed on a product page or search results
      const isProductPage = await page.evaluate(() => {
        // Check for product page elements
        const productTitle = document.querySelector('h1[data-testid="product-name"]');
        const productPrice = document.querySelector('div[data-testid="product-price"]');

        return {
          isProduct: !!productTitle || !!productPrice,
          title: productTitle ? productTitle.textContent : 'Not found',
          price: productPrice ? productPrice.textContent : 'Not found'
        };
      });

      if (isProductPage.isProduct) {
        console.log(`✅ Found product: ${isProductPage.title} - ${isProductPage.price}`);
      } else {
        console.log(`❌ Not a product page, redirected to search results`);
      }

      // Wait a moment before trying the next URL
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

  } catch (error) {
    console.error('Error during test:', error);
  } finally {
    await browser.close();
    console.log('Test completed');
  }
}

// Run the test
testZaloraDirectUrl();
