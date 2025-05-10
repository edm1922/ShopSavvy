// Simple script to test Zalora scraping without screenshots
const { chromium } = require('playwright');

async function testZalora() {
  console.log('Starting Zalora test...');
  
  // Launch browser
  const browser = await chromium.launch({ 
    headless: true, // Run in headless mode for simplicity
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
    
    // Try to find product elements
    const productInfo = await page.evaluate(() => {
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
      
      // Try each selector
      let foundProducts = [];
      let usedSelector = '';
      for (const selector of selectors) {
        const elements = document.querySelectorAll(selector);
        console.log(`Selector ${selector}: ${elements.length} elements`);
        
        if (elements.length > 0) {
          foundProducts = Array.from(elements);
          usedSelector = selector;
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
            const linkEl = item.querySelector('a');
            
            const title = titleEl ? titleEl.textContent.trim() : 'No title found';
            const price = priceEl ? priceEl.textContent.trim() : 'No price found';
            const link = linkEl ? linkEl.getAttribute('href') : 'No link found';
            
            products.push({ title, price, link });
          }
        });
      }
      
      // Get some page structure info
      const mainContent = document.querySelector('main');
      const bodyClasses = document.body.className;
      
      return {
        totalFound: foundProducts.length,
        usedSelector,
        sampleProducts: products,
        availableClasses: Array.from(allClasses).slice(0, 50), // Just get first 50 classes
        bodyClasses,
        hasMainElement: !!mainContent,
        mainElementId: mainContent ? mainContent.id : 'none',
        documentTitle: document.title
      };
    });
    
    console.log('Product count:', productInfo.totalFound);
    console.log('Used selector:', productInfo.usedSelector);
    console.log('Sample products:', JSON.stringify(productInfo.sampleProducts, null, 2));
    console.log('Body classes:', productInfo.bodyClasses);
    console.log('Has main element:', productInfo.hasMainElement);
    console.log('Main element ID:', productInfo.mainElementId);
    console.log('Document title:', productInfo.documentTitle);
    console.log('Available classes (first 50):', productInfo.availableClasses.join(', '));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close browser
    await browser.close();
    console.log('Test complete.');
  }
}

testZalora().catch(console.error);
