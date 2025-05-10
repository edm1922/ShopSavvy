const puppeteer = require('puppeteer');

/**
 * Test script for Zalora search URLs
 * 
 * This script tests the search URL approach for Zalora products.
 * It handles CAPTCHA detection and extracts products from search results.
 */
async function testZaloraSearchUrls() {
  console.log('Starting Zalora search URL test...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--window-size=1366,768']
  });
  
  try {
    const page = await browser.newPage();
    
    // Test search queries
    const searchQueries = [
      'shoes',
      'nike shoes',
      'adidas sneakers'
    ];
    
    // Test each search query
    for (const query of searchQueries) {
      console.log(`\n=== Testing search query: "${query}" ===\n`);
      
      // Navigate to search URL
      const searchUrl = `https://www.zalora.com.ph/search?q=${encodeURIComponent(query)}`;
      console.log(`Navigating to: ${searchUrl}`);
      
      await page.goto(searchUrl, {
        waitUntil: 'networkidle2',
        timeout: 60000
      });
      
      // Check for CAPTCHA
      const hasCaptcha = await page.evaluate(() => {
        return document.body.textContent.includes('Press & Hold to confirm you are a human') ||
               document.body.textContent.includes('Before we continue');
      });
      
      if (hasCaptcha) {
        console.log('⚠️ CAPTCHA detected on the page');
        
        // Wait for manual CAPTCHA solving
        console.log('Please solve the CAPTCHA manually...');
        await new Promise(resolve => setTimeout(resolve, 15000));
        
        console.log('Continuing after CAPTCHA...');
      }
      
      // Extract products
      const products = await page.evaluate(() => {
        const products = [];
        const baseUrl = 'https://www.zalora.com.ph';
        
        // Look for product cards
        const productCards = document.querySelectorAll('[data-testid="ProductCard"]');
        console.log(`Found ${productCards.length} product cards`);
        
        // Process each product card (limited to 5 for testing)
        const maxProducts = Math.min(productCards.length, 5);
        for (let i = 0; i < maxProducts; i++) {
          const card = productCards[i];
          
          try {
            // Extract product information
            const titleEl = card.querySelector('[data-testid="ProductCard-ProductName"]');
            const priceEl = card.querySelector('[data-testid="ProductCard-Price"]');
            const linkEl = card.querySelector('a');
            const imgEl = card.querySelector('img');
            
            // Get product URL
            const href = linkEl ? linkEl.getAttribute('href') : '';
            const productUrl = href ? (href.startsWith('http') ? href : baseUrl + href) : '';
            
            // Get product title
            const title = titleEl ? titleEl.textContent.trim() : '';
            
            // Get product price
            let price = 0;
            if (priceEl) {
              const priceText = priceEl.textContent.trim();
              const priceMatch = priceText.match(/(?:₱|PHP|P)?\s*([0-9,]+(?:\.\d{2})?)/);
              if (priceMatch && priceMatch[1]) {
                price = parseFloat(priceMatch[1].replace(/,/g, ''));
              }
            }
            
            // Get product image
            const imageUrl = imgEl ? imgEl.getAttribute('src') : '';
            
            // Add to results if we have the essential data
            if (productUrl && title) {
              products.push({
                title,
                price,
                productUrl,
                imageUrl
              });
            }
          } catch (e) {
            console.error(`Error extracting product ${i}:`, e);
          }
        }
        
        return products;
      });
      
      console.log(`Found ${products.length} products for query "${query}"`);
      
      // Print sample products
      if (products.length > 0) {
        console.log('\nSample products:');
        for (let i = 0; i < products.length; i++) {
          const product = products[i];
          console.log(`${i + 1}. ${product.title}`);
          console.log(`   Price: ${product.price}`);
          console.log(`   URL: ${product.productUrl}`);
          console.log(`   Image: ${product.imageUrl ? product.imageUrl.substring(0, 50) + '...' : 'No image'}`);
          console.log();
        }
      }
      
      // Wait a moment before trying the next query
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
testZaloraSearchUrls();
