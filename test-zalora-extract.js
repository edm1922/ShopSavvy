// Test script for Zalora direct product extraction
const { chromium } = require('playwright');
const fs = require('fs');

async function testZaloraExtraction() {
  console.log('Starting Zalora extraction test...');

  // Launch browser in headless mode
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-site-isolation-trials',
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--window-size=1920,1080',
      '--start-maximized',
    ],
    ignoreHTTPSErrors: true
  });

  // Create a new context with enhanced stealth settings
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    hasTouch: false,
    isMobile: false,
    javaScriptEnabled: true,
    locale: 'en-US',
    timezoneId: 'Asia/Manila',
    permissions: ['geolocation'],
    colorScheme: 'light',
  });

  // Add additional headers to appear more like a real browser
  await context.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9,es;q=0.8',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'sec-ch-ua': '"Google Chrome";v="123", "Not:A-Brand";v="8", "Chromium";v="123"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'Cache-Control': 'max-age=0',
    'Connection': 'keep-alive',
  });

  // Create a new page
  const page = await context.newPage();

  // Add anti-detection scripts
  await page.addInitScript(() => {
    // Overwrite the webdriver property
    Object.defineProperty(navigator, 'webdriver', {
      get: () => false,
    });

    // Overwrite user agent
    window.navigator.chrome = {
      runtime: {},
    };

    // Add fake plugins
    Object.defineProperty(navigator, 'plugins', {
      get: () => {
        return [
          {
            0: {type: 'application/pdf'},
            name: 'Chrome PDF Plugin',
            filename: 'internal-pdf-viewer',
            description: 'Portable Document Format'
          },
          {
            0: {type: 'application/pdf'},
            name: 'Chrome PDF Viewer',
            filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai',
            description: 'Portable Document Format'
          }
        ];
      },
    });
  });

  try {
    // Navigate to Zalora
    console.log('Navigating to Zalora search page...');
    // Use a more specific search term that's likely to return results
    await page.goto('https://www.zalora.com.ph/women-shoes/', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    // Wait for the page to load
    console.log('Waiting for page to load...');

    // Wait for any product elements to appear
    try {
      // Try multiple selectors that might indicate products have loaded
      const productSelectors = [
        'a[href*="/p/"]',
        '.product-card',
        '.productCard',
        '[class*="product"]',
        '[class*="card"]',
        'img[src*="zalora"]'
      ];

      const selectorPromises = productSelectors.map(selector =>
        page.waitForSelector(selector, { timeout: 5000 })
          .then(() => true)
          .catch(() => false)
      );

      const results = await Promise.all(selectorPromises);
      const foundSelector = results.some(result => result);

      if (foundSelector) {
        console.log('Found product elements on the page');
      } else {
        console.log('No product elements found with standard selectors');
      }
    } catch (error) {
      console.log('Error waiting for product elements:', error.message);
    }

    // Wait a bit for any remaining client-side rendering
    await page.waitForTimeout(5000);

    // Extract products directly from the DOM with a more comprehensive approach
    const directProducts = await page.evaluate(() => {
      const products = [];
      const baseUrl = 'https://www.zalora.com.ph';

      // First, log all the classes in the document to help with debugging
      const allClasses = new Set();
      document.querySelectorAll('*[class]').forEach(el => {
        if (el.className && typeof el.className === 'string') {
          el.className.split(' ').forEach(cls => allClasses.add(cls));
        }
      });
      console.log('Available classes:', Array.from(allClasses).join(', '));

      // Look for product links - this is the most reliable approach
      const productLinks = document.querySelectorAll('a[href*="/p/"]');
      console.log(`Found ${productLinks.length} product links with href containing /p/`);

      // Log the first 3 product links for debugging
      const linkSamples = Array.from(productLinks).slice(0, 3).map(link => ({
        href: link.href,
        text: link.textContent.substring(0, 100),
        html: link.outerHTML.substring(0, 100)
      }));
      console.log('Sample links:', JSON.stringify(linkSamples, null, 2));

      // Try a different approach - look for any elements that might be product cards
      const cardElements = document.querySelectorAll('[class*="product"], [class*="card"], [class*="item"], [class*="tile"]');
      console.log(`Found ${cardElements.length} potential product card elements`);

      // Process product links
      productLinks.forEach(link => {
        try {
          // Check if this looks like a product card
          const text = link.textContent || '';
          const hasImage = !!link.querySelector('img');

          // Get the product URL
          const href = link.getAttribute('href') || '';
          const productUrl = href.startsWith('http') ? href : baseUrl + href;

          // Get the image
          const img = link.querySelector('img');
          const imageUrl = img ? (img.getAttribute('src') || img.getAttribute('data-src') || '') : '';

          // Look for price text anywhere in the link or its parent elements
          let priceText = '';
          let priceElement = link;

          // Check the link itself
          if (text.match(/(?:₱|Php|P)\s*\d+/i)) {
            priceText = text;
          }
          // Check parent elements up to 3 levels
          else {
            let parent = link.parentElement;
            for (let i = 0; i < 3 && parent; i++) {
              const parentText = parent.textContent || '';
              if (parentText.match(/(?:₱|Php|P)\s*\d+/i)) {
                priceText = parentText;
                priceElement = parent;
                break;
              }
              parent = parent.parentElement;
            }
          }

          // If we found price text, extract the product details
          if (priceText) {
            // Extract title - try to find a specific title element first
            let title = '';
            const titleElement = priceElement.querySelector('[class*="name"], [class*="title"], h3, h4');

            if (titleElement) {
              title = titleElement.textContent.trim();
            } else {
              // Extract title from text (everything before the price)
              if (priceText.includes('₱')) {
                title = priceText.split('₱')[0].trim();
              } else if (priceText.includes('Php')) {
                title = priceText.split('Php')[0].trim();
              } else {
                // Just use the first part of the text as title
                title = priceText.substring(0, priceText.search(/\d/)).trim();
              }
            }

            // Extract price using regex
            const priceMatch = priceText.match(/(?:₱|Php|P)\s*([0-9,]+(?:\.[0-9]{2})?)/i);
            let price = 0;
            if (priceMatch && priceMatch[1]) {
              price = parseFloat(priceMatch[1].replace(/,/g, ''));
            }

            // Add to results if we have the essential data
            if (title && price > 0 && productUrl) {
              products.push({
                id: `zalora-${Math.random().toString(36).substring(2, 15)}`,
                title,
                price,
                productUrl,
                imageUrl,
                platform: 'zalora',
                source: 'direct_extraction'
              });
            }
          }
        } catch (e) {
          console.error('Error extracting product:', e);
        }
      });

      // If we still couldn't find products, try a more generic approach
      if (products.length === 0) {
        // Look for elements with price-like text
        const priceElements = Array.from(document.querySelectorAll('*')).filter(el => {
          const text = el.textContent || '';
          return text.match(/(?:₱|Php|P)\s*\d+(?:,\d{3})*(?:\.\d{2})?/i);
        }).slice(0, 50); // Limit to first 50 to avoid performance issues

        console.log(`Found ${priceElements.length} elements with price-like text`);

        priceElements.forEach(priceEl => {
          try {
            // Find a parent element that might be a product card
            let parent = priceEl.parentElement;
            for (let i = 0; i < 5 && parent; i++) { // Look up to 5 levels up
              // Check if this parent has an image and a link
              const hasImage = !!parent.querySelector('img');
              const link = parent.querySelector('a[href*="/p/"]');

              if (hasImage && link) {
                const href = link.getAttribute('href') || '';
                const productUrl = href.startsWith('http') ? href : baseUrl + href;

                const img = parent.querySelector('img');
                const imageUrl = img ? (img.getAttribute('src') || img.getAttribute('data-src') || '') : '';

                // Extract title - try to find a specific title element first
                let title = '';
                const titleEl = parent.querySelector('[class*="name"], [class*="title"], h3, h4');

                if (titleEl) {
                  title = titleEl.textContent.trim();
                } else {
                  // Just use the link text as title
                  title = link.textContent.trim();
                }

                // Extract price
                const priceText = priceEl.textContent || '';
                let price = 0;

                const symbolMatch = priceText.match(/(?:₱|Php|P)\s*([0-9,]+(?:\.\d{2})?)/i);
                if (symbolMatch && symbolMatch[1]) {
                  price = parseFloat(symbolMatch[1].replace(/,/g, ''));
                }

                if (title && price > 0 && productUrl) {
                  products.push({
                    id: `zalora-${Math.random().toString(36).substring(2, 15)}`,
                    title,
                    price,
                    productUrl,
                    imageUrl,
                    platform: 'zalora',
                    source: 'generic_extraction'
                  });
                }

                break;
              }

              parent = parent.parentElement;
            }
          } catch (e) {
            console.error('Error in generic extraction:', e);
          }
        });
      }

      return products;
    });

    console.log(`Found ${directProducts.length} products using direct extraction`);
    if (directProducts.length > 0) {
      console.log('First 3 products:');
      directProducts.slice(0, 3).forEach((product, index) => {
        console.log(`Product ${index + 1}:`, JSON.stringify(product, null, 2));
      });
    }

    // Save the HTML for inspection
    const html = await page.content();
    fs.writeFileSync('zalora-extract-test.html', html);
    console.log('HTML saved to zalora-extract-test.html');

    console.log('Test complete.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close browser
    await browser.close();
    console.log('Browser closed.');
  }
}

testZaloraExtraction().catch(console.error);
