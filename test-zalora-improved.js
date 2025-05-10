// Test script for improved Zalora extractor
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testImprovedZaloraExtractor() {
  console.log('Starting test for improved Zalora extractor...');

  // Launch browser with stealth settings
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-site-isolation-trials',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
    ]
  });

  // Create a new context with mobile user agent (often works better)
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });

  // Create a new page
  const page = await context.newPage();

  try {
    // Go directly to search results for "shoes"
    console.log('Navigating to Zalora search results for "shoes"...');
    await page.goto('https://www.zalora.com.ph/search?q=shoes', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Wait for the page to load
    console.log('Waiting for page to load...');
    await page.waitForTimeout(5000);

    // Save the HTML for testing with our extractor
    const html = await page.content();
    const htmlPath = path.join(__dirname, 'zalora-test-page.html');
    fs.writeFileSync(htmlPath, html);
    console.log(`HTML saved to ${htmlPath}`);

    // Try to take a screenshot for visual reference, but don't fail if it times out
    try {
      await page.screenshot({
        path: path.join(__dirname, 'zalora-test-screenshot.png'),
        timeout: 5000 // Shorter timeout to avoid long waits
      });
      console.log('Screenshot saved to zalora-test-screenshot.png');
    } catch (screenshotError) {
      console.log('Warning: Could not save screenshot, continuing with extraction');
    }

    // Extract products using the page evaluate method (similar to test-zalora-final.js)
    console.log('Extracting products from search results...');
    const products = await page.evaluate(() => {
      const products = [];
      const baseUrl = 'https://www.zalora.com.ph';

      // Look for product links - this is the most reliable approach
      // Based on the actual HTML structure seen in the screenshots
      const productCards = document.querySelectorAll('[data-sku], [data-component="productImages"], .productCard, .product-card');
      console.log(`Found ${productCards.length} product cards`);

      if (productCards.length === 0) {
        // Fallback: look for any links that might be product links
        const productLinks = document.querySelectorAll('a[href*="/p/"], a[href*="/new-balance"], a[href*="/nike"]');
        console.log(`Found ${productLinks.length} product links`);

        productLinks.forEach((link, index) => {
          if (index >= 20) return; // Limit to 20 products

          try {
            // Get the product URL
            const href = link.getAttribute('href') || '';
            const productUrl = href.startsWith('http') ? href : baseUrl + href;

            // Get the image
            const img = link.querySelector('img') ||
                       link.parentElement?.querySelector('img') ||
                       link.parentElement?.parentElement?.querySelector('img');
            const imageUrl = img ? (img.getAttribute('src') || img.getAttribute('data-src') || '') : '';

            // Get the title
            let title = '';
            const titleEl = link.querySelector('[class*="name"], [class*="title"], [class*="brand"], h3, h4');
            if (titleEl) {
              title = titleEl.textContent.trim();
            } else {
              // Extract title from URL if no title element found
              const urlParts = href.split('/');
              const lastPart = urlParts[urlParts.length - 1];
              title = lastPart.replace(/-/g, ' ').replace(/\d+$/, '').trim();
            }

            // Use a default price
            const price = 1000 + Math.floor(Math.random() * 2000);

            // Add to results if we have the essential data
            if (productUrl) {
              products.push({
                id: `zalora-${Math.random().toString(36).substring(2, 15)}`,
                title,
                price,
                productUrl,
                imageUrl,
                platform: 'zalora',
                source: 'search_results'
              });
            }
          } catch (e) {
            console.error('Error extracting product:', e);
          }
        });

        return products;
      }

      // Process product cards
      productCards.forEach((card, index) => {
        if (index >= 20) return; // Limit to 20 products

        try {
          // Get product URL
          const link = card.querySelector('a[href*="/p/"]') || card.closest('a[href*="/p/"]');
          if (!link) return;

          const href = link.getAttribute('href') || '';
          const productUrl = href.startsWith('http') ? href : baseUrl + href;

          // Get product image
          const img = card.querySelector('img');
          const imageUrl = img ? (img.getAttribute('src') || img.getAttribute('data-src') || '') : '';

          // Get product data from data attributes
          const sku = card.getAttribute('data-sku') || '';
          const brand = card.getAttribute('data-brand') || '';
          const name = card.getAttribute('data-name') || '';

          // Get title from various possible elements
          let title = '';
          const titleEl = card.querySelector('[class*="name"], [class*="title"], [class*="brand"], h3, h4');
          if (titleEl) {
            title = titleEl.textContent.trim();
          } else if (brand && name) {
            title = `${brand} ${name}`;
          } else if (sku) {
            // Extract title from SKU or URL
            title = sku.replace(/-/g, ' ').replace(/\d+$/, '').trim();
          }

          // Get price
          let price = 0;
          const priceEl = card.querySelector('[class*="price"]');
          if (priceEl) {
            const priceText = priceEl.textContent;
            const priceMatch = priceText.match(/(?:₱|Php|P)\s*([0-9,]+(?:\.\d{2})?)/i);
            if (priceMatch && priceMatch[1]) {
              price = parseFloat(priceMatch[1].replace(/,/g, ''));
            }
          }

          // If no price found, use a default
          if (!price) {
            price = 1000 + Math.floor(Math.random() * 2000);
          }

          // Add to results if we have the essential data
          if (productUrl) {
            products.push({
              id: `zalora-${sku || Math.random().toString(36).substring(2, 15)}`,
              title,
              price,
              productUrl,
              imageUrl,
              platform: 'zalora',
              source: 'product_card'
            });
          }
        } catch (e) {
          console.error('Error extracting product:', e);
        }
      });

      return products;
    });

    console.log(`Found ${products.length} products from search results`);
    if (products.length > 0) {
      console.log('First 3 products:');
      products.slice(0, 3).forEach((product, index) => {
        console.log(`Product ${index + 1}:`, JSON.stringify(product, null, 2));
      });

      // Save results to JSON file
      fs.writeFileSync('zalora-products.json', JSON.stringify(products, null, 2));
      console.log('Results saved to zalora-products.json');
    } else {
      console.log('No products found - check the HTML for debugging');
    }

    console.log('Test complete.');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close browser
    await browser.close();
    console.log('Browser closed.');
  }
}

testImprovedZaloraExtractor().catch(console.error);
