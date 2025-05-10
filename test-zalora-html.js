// Script to examine Zalora HTML structure
const { chromium } = require('playwright');
const fs = require('fs');

async function testZalora() {
  console.log('Starting Zalora HTML examination...');
  
  // Launch browser
  const browser = await chromium.launch({ 
    headless: true,
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
      waitUntil: 'networkidle', // Wait until network is idle
      timeout: 60000 // Longer timeout
    });
    
    // Get page title and URL
    const title = await page.title();
    const url = page.url();
    console.log(`Page title: ${title}`);
    console.log(`Page URL: ${url}`);
    
    // Save the HTML for inspection
    const html = await page.content();
    fs.writeFileSync('zalora-page.html', html);
    console.log('HTML saved to zalora-page.html');
    console.log(`HTML length: ${html.length} characters`);
    
    // Check if there's a React app
    const hasReact = await page.evaluate(() => {
      return !!window.__REACT_QUERY_GLOBAL__ || 
             !!window.__NEXT_DATA__ || 
             !!document.querySelector('[data-reactroot]') ||
             !!window.React;
    });
    console.log('Is React app:', hasReact);
    
    // Check for lazy loading
    const hasLazyLoading = await page.evaluate(() => {
      return !!document.querySelector('[loading="lazy"]') || 
             !!document.querySelector('[data-src]') ||
             !!document.querySelector('[data-lazy]');
    });
    console.log('Has lazy loading:', hasLazyLoading);
    
    // Check for infinite scroll
    const hasInfiniteScroll = await page.evaluate(() => {
      return !!document.querySelector('[data-infinite-scroll]') ||
             !!document.querySelector('[data-scroll]') ||
             !!document.querySelector('.infinite-scroll');
    });
    console.log('Has infinite scroll:', hasInfiniteScroll);
    
    // Try to find product grid or container
    const gridInfo = await page.evaluate(() => {
      const possibleGrids = [
        'div[class*="grid"]',
        'div[class*="products"]',
        'div[class*="catalog"]',
        'div[class*="search-results"]',
        'div[class*="product-list"]',
        'ul[class*="products"]',
        'section[class*="products"]'
      ];
      
      for (const selector of possibleGrids) {
        const elements = document.querySelectorAll(selector);
        if (elements.length > 0) {
          return {
            selector,
            count: elements.length,
            firstElementClasses: elements[0].className,
            childCount: elements[0].children.length
          };
        }
      }
      
      return { selector: 'none found', count: 0 };
    });
    console.log('Product grid info:', gridInfo);
    
    // Try scrolling to load more content
    console.log('Scrolling to load more content...');
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight / 2);
    });
    await page.waitForTimeout(2000);
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await page.waitForTimeout(2000);
    
    // Check again after scrolling
    const afterScrollInfo = await page.evaluate(() => {
      // Look for product elements again
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
      
      const results = {};
      for (const selector of selectors) {
        results[selector] = document.querySelectorAll(selector).length;
      }
      
      return results;
    });
    console.log('After scrolling product counts:', afterScrollInfo);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close browser
    await browser.close();
    console.log('Test complete.');
  }
}

testZalora().catch(console.error);
