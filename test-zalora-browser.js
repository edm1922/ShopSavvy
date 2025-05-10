// Script to test Zalora scraping with browser-like settings
const { chromium } = require('playwright');

async function testZalora() {
  console.log('Starting Zalora test with browser-like settings...');

  // Launch browser
  const browser = await chromium.launch({
    headless: false, // Use non-headless to see what's happening
    args: ['--disable-blink-features=AutomationControlled'] // Hide automation
  });

  // Create a context with more browser-like settings
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 768 },
    deviceScaleFactor: 1,
    hasTouch: false,
    isMobile: false,
    javaScriptEnabled: true,
    locale: 'en-US',
    timezoneId: 'Asia/Manila',
    geolocation: { longitude: 121.0, latitude: 14.6 }, // Manila coordinates
    permissions: ['geolocation'],
    colorScheme: 'light',
    acceptDownloads: true,
    ignoreHTTPSErrors: true
  });

  // Add browser fingerprint evasion
  await context.addInitScript(() => {
    // Override the navigator properties
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5].map(() => ({ name: 'Chrome PDF Plugin' })) });
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });

    // Override the permissions
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications' ?
        Promise.resolve({ state: Notification.permission }) :
        originalQuery(parameters)
    );

    // Add some fake plugins
    const plugins = [
      { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
      { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: 'Portable Document Format' },
      { name: 'Native Client', filename: 'internal-nacl-plugin', description: 'Native Client' }
    ];

    // Define a fake plugins array
    Object.defineProperty(navigator, 'plugins', {
      get: function() {
        return {
          length: plugins.length,
          item: function(index) { return plugins[index] },
          namedItem: function(name) { return plugins.find(p => p.name === name) },
          refresh: function() {},
          [Symbol.iterator]: function*() { yield* plugins }
        };
      }
    });
  });

  // Create a new page
  const page = await context.newPage();

  try {
    // Set headers that look like a real browser
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'sec-ch-ua': '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-User': '?1',
      'Sec-Fetch-Dest': 'document',
      'Upgrade-Insecure-Requests': '1'
    });

    // Navigate to Zalora with exact URL from browser
    console.log('Navigating to Zalora search page...');
    await page.goto('zalora.com.ph/search?q=shoes', {
      waitUntil: 'load', // Wait for load event
      timeout: 30000
    });

    // Simulate human-like behavior
    console.log('Simulating human-like behavior...');

    // Random mouse movements
    for (let i = 0; i < 3; i++) {
      await page.mouse.move(
        100 + Math.floor(Math.random() * 500),
        100 + Math.floor(Math.random() * 300),
        { steps: 10 }
      );
      await page.waitForTimeout(300 + Math.random() * 500);
    }

    // Scroll down slowly
    await page.evaluate(async () => {
      await new Promise(resolve => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= document.body.scrollHeight / 2) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });

    // Wait for content to load
    await page.waitForTimeout(5000);

    // Log the page title and URL
    const title = await page.title();
    const url = page.url();
    console.log(`Page title: ${title}`);
    console.log(`Page URL: ${url}`);

    // Check if we have search results
    const hasResults = await page.evaluate(() => {
      return document.body.textContent.includes('items found');
    });

    console.log(`Has search results: ${hasResults}`);

    // Try to extract products
    console.log('Extracting products...');
    const products = await page.evaluate(() => {
      const results = [];

      // Find all product cards - look for links to product pages
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
            const productUrl = href.startsWith('http') ? href : 'http://www.zalora.com.ph' + href;

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
