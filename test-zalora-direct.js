// Simple script to test Zalora scraping with our simplified approach
const { chromium } = require('playwright');

async function testZalora() {
  console.log('Starting Zalora test with simplified approach...');

  // Launch browser
  const browser = await chromium.launch({
    headless: false, // Use non-headless to see what's happening
  });

  // Create a new context
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 768 }
  });

  // Create a new page
  const page = await context.newPage();

  try {
    // Set minimal headers
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
    });

    // Navigate to Zalora - try a more specific search term
    console.log('Navigating to Zalora search page...');
    await page.goto('https://www.zalora.com.ph/search?q=sneakers', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Wait for the page to load
    console.log('Waiting for page to load...');
    await page.waitForTimeout(5000);

    // Log the page title and URL
    const title = await page.title();
    const url = page.url();
    console.log(`Page title: ${title}`);
    console.log(`Page URL: ${url}`);

    // Try to extract products directly
    console.log('Extracting products...');
    const products = await page.evaluate(() => {
      const results = [];

      // Find all links that might be product cards
      const productLinks = Array.from(document.querySelectorAll('a[href*="/p/"]'));
      console.log(`Found ${productLinks.length} potential product links`);

      // Process each link
      productLinks.forEach(link => {
        try {
          // Check if this looks like a product card
          const hasImage = !!link.querySelector('img');
          const text = link.textContent || '';
          const hasPriceText = text.includes('₱') || text.includes('Php');

          if (hasImage && hasPriceText) {
            // Get the image
            const img = link.querySelector('img');
            const imageUrl = img ? img.src : '';

            // Get the product URL
            const href = link.getAttribute('href') || '';
            const productUrl = href.startsWith('http') ? href : 'https://www.zalora.com.ph' + href;

            // Extract title from text (everything before the price)
            let title = '';
            if (text.includes('₱')) {
              title = text.split('₱')[0].trim();
            } else if (text.includes('Php')) {
              title = text.split('Php')[0].trim();
            } else {
              title = text.trim();
            }

            // Extract price using regex
            const priceMatch = text.match(/(?:₱|Php)\s*([0-9,]+(?:\.[0-9]{2})?)/);
            let price = 0;
            if (priceMatch && priceMatch[1]) {
              price = parseFloat(priceMatch[1].replace(/,/g, ''));
            }

            // Add to results if we have the essential data
            if (title && price > 0 && productUrl) {
              results.push({
                title,
                price,
                productUrl,
                imageUrl,
                platform: 'zalora'
              });
            }
          }
        } catch (e) {
          console.error('Error processing product link:', e);
        }
      });

      return results;
    });

    console.log(`Found ${products.length} products`);

    // Print the first 3 products
    if (products.length > 0) {
      console.log('First 3 products:');
      products.slice(0, 3).forEach((product, index) => {
        console.log(`Product ${index + 1}:`);
        console.log(`  Title: ${product.title}`);
        console.log(`  Price: ${product.price}`);
        console.log(`  URL: ${product.productUrl}`);
        console.log(`  Image: ${product.imageUrl}`);
      });
    }

    // Try a different approach - look for product cards
    console.log('\nTrying alternative approach...');
    const productCards = await page.evaluate(() => {
      // Look for elements that might be product cards
      const cardSelectors = [
        '.product-card',
        '.productCard',
        '.card',
        '[class*="product"]',
        '[class*="card"]'
      ];

      let cards = [];
      for (const selector of cardSelectors) {
        const elements = document.querySelectorAll(selector);
        console.log(`Selector ${selector}: ${elements.length} elements`);
        if (elements.length > 0) {
          cards = Array.from(elements);
          break;
        }
      }

      return {
        count: cards.length,
        classes: cards.length > 0 ? cards.map(card => card.className) : []
      };
    });

    console.log(`Found ${productCards.count} product cards`);
    if (productCards.count > 0) {
      console.log('Product card classes:', productCards.classes.slice(0, 5));
    }

    // Wait for user to see the page
    console.log('\nTest complete. Press any key to exit...');
    await page.waitForTimeout(30000);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close browser
    await browser.close();
    console.log('Browser closed.');
  }
}

testZalora().catch(console.error);
