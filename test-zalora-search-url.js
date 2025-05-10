const puppeteer = require('puppeteer');

/**
 * Test script to verify search URL approach for Zalora products
 */
async function testZaloraSearchUrl() {
  console.log('Starting Zalora search URL test...');
  
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
    
    // Check for CAPTCHA
    const hasCaptcha = await page.evaluate(() => {
      return document.body.textContent.includes('Press & Hold to confirm you are a human');
    });
    
    if (hasCaptcha) {
      console.log('⚠️ CAPTCHA detected on the page');
      
      // Wait for manual CAPTCHA solving
      console.log('Please solve the CAPTCHA manually...');
      await new Promise(resolve => setTimeout(resolve, 15000));
      
      console.log('Continuing after CAPTCHA...');
    }
    
    // Test brand-specific search URLs
    console.log('\nTesting brand-specific search URLs:');
    
    const brands = [
      'Nike', 'Adidas', 'Puma', 'Reebok', 'New Balance'
    ];
    
    for (const brand of brands) {
      const searchUrl = `https://www.zalora.com.ph/search?q=${encodeURIComponent(brand + ' ' + searchQuery)}`;
      console.log(`Testing URL: ${searchUrl}`);
      
      await page.goto(searchUrl, {
        waitUntil: 'networkidle2',
        timeout: 60000
      });
      
      // Check for CAPTCHA
      const hasCaptcha = await page.evaluate(() => {
        return document.body.textContent.includes('Press & Hold to confirm you are a human');
      });
      
      if (hasCaptcha) {
        console.log('⚠️ CAPTCHA detected on the page');
        
        // Wait for manual CAPTCHA solving
        console.log('Please solve the CAPTCHA manually...');
        await new Promise(resolve => setTimeout(resolve, 15000));
        
        console.log('Continuing after CAPTCHA...');
      }
      
      // Extract search results
      const searchResults = await page.evaluate(() => {
        const products = [];
        const productCards = document.querySelectorAll('div[data-testid="ProductCard"]');
        
        productCards.forEach((card, index) => {
          if (index < 5) { // Limit to 5 products for testing
            const titleElement = card.querySelector('div[data-testid="ProductCard-ProductName"]');
            const priceElement = card.querySelector('div[data-testid="ProductCard-Price"]');
            const linkElement = card.querySelector('a');
            const imageElement = card.querySelector('img');
            
            products.push({
              title: titleElement ? titleElement.textContent : 'Unknown',
              price: priceElement ? priceElement.textContent : 'Unknown',
              url: linkElement ? linkElement.href : 'Unknown',
              image: imageElement ? imageElement.src : 'Unknown'
            });
          }
        });
        
        return {
          count: productCards.length,
          products
        };
      });
      
      console.log(`Found ${searchResults.count} products for "${brand} ${searchQuery}"`);
      
      if (searchResults.products.length > 0) {
        console.log('Sample products:');
        searchResults.products.forEach((product, index) => {
          console.log(`${index + 1}. ${product.title} - ${product.price}`);
          console.log(`   URL: ${product.url}`);
        });
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
testZaloraSearchUrl();
