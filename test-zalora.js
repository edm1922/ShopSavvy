// Simple script to test Zalora scraping
const { chromium } = require('playwright');

async function testZalora() {
  console.log('Starting Zalora test...');
  
  // Launch browser
  const browser = await chromium.launch({ 
    headless: false, // Set to true for headless mode
  });
  
  // Create a new context
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 768 }
  });
  
  // Create a new page
  const page = await context.newPage();
  
  try {
    // Navigate to Zalora
    console.log('Navigating to Zalora search page...');
    await page.goto('https://www.zalora.com.ph/search?q=shoes', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    // Wait for some time to let the page load
    await page.waitForTimeout(5000);
    
    // Get page title and URL
    const title = await page.title();
    const url = page.url();
    console.log(`Page title: ${title}`);
    console.log(`Page URL: ${url}`);
    
    // Take a screenshot
    await page.screenshot({ path: 'zalora-test.png' });
    console.log('Screenshot saved to zalora-test.png');
    
    // Try to find product elements
    const productCount = await page.evaluate(() => {
      // Try different selectors
      const selectors = [
        '.product',
        '.b-catalogCard',
        '.catalogCard',
        '.productCard',
        '.product-card',
        '.itm',
        '[data-testid="ProductCard"]',
        '[data-qa="product-card"]',
        '.b-products__item'
      ];
      
      // Log all classes for debugging
      const allClasses = new Set();
      document.querySelectorAll('*').forEach(el => {
        if (el.className && typeof el.className === 'string') {
          el.className.split(' ').forEach(cls => allClasses.add(cls));
        }
      });
      console.log('Available classes:', Array.from(allClasses).join(', '));
      
      // Try each selector
      let foundProducts = [];
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        console.log(`Selector ${selector}: ${elements.length} elements`);
        
        if (elements.length > 0) {
          foundProducts = elements;
          break;
        }
      }
      
      // If we found products, extract some data
      const products = [];
      if (foundProducts.length > 0) {
        foundProducts.forEach((item, index) => {
          if (index < 5) { // Just get the first 5 for testing
            const titleEl = item.querySelector('.product-name, .name, h3, [class*="name"], [class*="title"]');
            const priceEl = item.querySelector('.product-price, .price, [class*="price"], [class*="Price"]');
            
            const title = titleEl ? titleEl.textContent.trim() : 'No title found';
            const price = priceEl ? priceEl.textContent.trim() : 'No price found';
            
            products.push({ title, price });
          }
        });
      }
      
      return {
        totalFound: foundProducts.length,
        sampleProducts: products,
        documentHTML: document.documentElement.outerHTML.length
      };
    });
    
    console.log('Product count:', productCount.totalFound);
    console.log('Sample products:', productCount.sampleProducts);
    console.log('HTML length:', productCount.documentHTML);
    
    // Save the HTML for inspection
    const html = await page.content();
    require('fs').writeFileSync('zalora-page.html', html);
    console.log('HTML saved to zalora-page.html');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Wait for user to see the page
    console.log('Test complete. Press Ctrl+C to exit.');
    await page.waitForTimeout(30000); // Wait 30 seconds before closing
    
    // Close browser
    await browser.close();
  }
}

testZalora().catch(console.error);
