// Advanced test script for Shein using Puppeteer with CAPTCHA bypassing techniques
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Function to generate a random delay
const randomDelay = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Function to simulate human-like typing
async function humanType(page, selector, text) {
  await page.focus(selector);

  for (const char of text) {
    await page.keyboard.type(char);
    // Random delay between keystrokes (30-100ms)
    await new Promise(r => setTimeout(r, randomDelay(30, 100)));
  }
}

// Function to simulate human-like mouse movement
async function humanMove(page, selector) {
  // Get the bounding box of the element
  const elementHandle = await page.$(selector);
  if (!elementHandle) return;

  const box = await elementHandle.boundingBox();
  if (!box) return;

  // Start from a random position within the viewport
  const viewportSize = await page.viewport();
  const startX = randomDelay(0, viewportSize.width);
  const startY = randomDelay(0, viewportSize.height);

  // Move to element with some randomness
  await page.mouse.move(startX, startY);

  // Create a few random waypoints to simulate natural movement
  const waypoints = 5;
  for (let i = 1; i <= waypoints; i++) {
    const x = startX + ((box.x + box.width/2 - startX) * (i / waypoints)) + randomDelay(-10, 10);
    const y = startY + ((box.y + box.height/2 - startY) * (i / waypoints)) + randomDelay(-10, 10);

    await page.mouse.move(x, y);
    await new Promise(r => setTimeout(r, randomDelay(50, 150)));
  }

  // Final move to the element's center
  await page.mouse.move(box.x + box.width/2, box.y + box.height/2);
  await new Promise(r => setTimeout(r, randomDelay(50, 150)));
}

async function testSheinWithPuppeteer() {
  console.log('=== Testing Shein with Puppeteer (CAPTCHA Bypass) ===');

  // Create a directory for cookies if it doesn't exist
  const cookiesDir = path.join(__dirname, 'cookies');
  if (!fs.existsSync(cookiesDir)) {
    fs.mkdirSync(cookiesDir);
  }

  const cookiesPath = path.join(cookiesDir, 'shein-cookies.json');

  // Launch a browser with advanced anti-detection settings
  const browser = await puppeteer.launch({
    headless: true, // Set to true for headless mode
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-site-isolation-trials',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--window-size=1920,1080',
      '--start-maximized',
      // Proxy settings (uncomment and configure if needed)
      // '--proxy-server=http://your-proxy-address:port',
    ],
    ignoreHTTPSErrors: true
  });

  try {
    // Create a new page with a custom user agent
    const page = await browser.newPage();

    // Override navigator.webdriver property to prevent detection
    await page.evaluateOnNewDocument(() => {
      // Overwrite the webdriver property
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });

      // Overwrite user agent
      window.navigator.chrome = {
        runtime: {},
      };

      // Create a fake notification API
      window.Notification = {
        permission: 'granted',
        requestPermission: () => Promise.resolve('granted'),
      };

      // Add language plugins to appear more like a real browser
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en', 'es'],
      });

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

    // Set a realistic user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');

    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Set extra HTTP headers to appear more like a real browser
    await page.setExtraHTTPHeaders({
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
    });

    // Load cookies if they exist
    try {
      if (fs.existsSync(cookiesPath)) {
        const cookiesString = fs.readFileSync(cookiesPath);
        const cookies = JSON.parse(cookiesString);
        await page.setCookie(...cookies);
        console.log('Loaded cookies from file');
      }
    } catch (error) {
      console.log('No cookies found or error loading cookies:', error.message);
    }

    // Modify request interception to be more selective
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const resourceType = request.resourceType();
      const url = request.url();

      // Only block non-essential resources
      if (
        ['image', 'media'].includes(resourceType) &&
        !url.includes('captcha') &&
        !url.includes('verify')
      ) {
        request.abort();
      } else {
        request.continue();
      }
    });

    // Add CAPTCHA detection and handling functions
    async function checkForCaptcha(page) {
      // Take a screenshot for debugging
      await page.screenshot({ path: 'captcha-check.png' });

      // Check for common CAPTCHA indicators in the page content
      const hasCaptcha = await page.evaluate(() => {
        const bodyText = document.body.innerText.toLowerCase();
        return bodyText.includes('captcha') ||
               bodyText.includes('please select') ||
               bodyText.includes('verify') ||
               bodyText.includes('verification') ||
               bodyText.includes('security check') ||
               bodyText.includes('confirm you are human') ||
               bodyText.includes('following graphics') ||
               document.querySelector('iframe[src*="captcha"]') !== null ||
               document.querySelector('img[src*="captcha"]') !== null;
      });

      return hasCaptcha;
    }

    async function handleCaptcha(page) {
      console.log('Attempting to handle CAPTCHA...');

      // Take a screenshot of the CAPTCHA
      await page.screenshot({ path: 'captcha-detected.png' });

      // Check if it's an icon ordering CAPTCHA (like the one in the screenshot)
      const isIconOrderingCaptcha = await page.evaluate(() => {
        return document.body.innerText.includes('Please select the following graphics in order');
      });

      if (isIconOrderingCaptcha) {
        console.log('Detected icon ordering CAPTCHA');

        // This type of CAPTCHA requires manual intervention
        console.log('CAPTCHA requires manual solving. Please check the browser window.');

        // Wait for manual intervention (30 seconds)
        console.log('Waiting 30 seconds for manual CAPTCHA solving...');
        await new Promise(r => setTimeout(r, 30000));

        // Check if CAPTCHA is still present
        const captchaStillPresent = await checkForCaptcha(page);
        if (captchaStillPresent) {
          console.log('CAPTCHA still present after waiting. May need more time.');
        } else {
          console.log('CAPTCHA appears to be solved!');
        }
      } else {
        // For other types of CAPTCHAs, we can try to find and click buttons
        const captchaButtons = await page.$$('button, .btn, [type="submit"], [role="button"]');

        if (captchaButtons.length > 0) {
          console.log(`Found ${captchaButtons.length} potential CAPTCHA buttons`);

          // Click the most likely CAPTCHA button (usually the last one)
          await captchaButtons[captchaButtons.length - 1].click().catch(e => {
            console.log('Error clicking CAPTCHA button:', e.message);
          });

          // Wait a bit after clicking
          await new Promise(r => setTimeout(r, randomDelay(2000, 4000)));
        } else {
          console.log('No CAPTCHA buttons found');
        }
      }
    }

    // Navigate to Shein homepage with random timing
    console.log('Navigating to Shein homepage...');
    await page.goto('https://ph.shein.com', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    // Add a random delay to simulate human behavior
    await new Promise(r => setTimeout(r, randomDelay(1000, 3000)));

    // Check for CAPTCHA on the homepage
    const hasCaptchaOnHomepage = await checkForCaptcha(page);
    if (hasCaptchaOnHomepage) {
      console.log('CAPTCHA detected on homepage!');
      await handleCaptcha(page);
    } else {
      console.log('No CAPTCHA detected on homepage');
    }

    // Take a screenshot of the homepage
    await page.screenshot({ path: 'shein-homepage-puppeteer.png' });
    console.log('Screenshot saved to shein-homepage-puppeteer.png');

    // Save cookies after successful navigation
    const cookies = await page.cookies();
    fs.writeFileSync(cookiesPath, JSON.stringify(cookies, null, 2));
    console.log('Cookies saved to file');

    // Random delay before searching
    await new Promise(r => setTimeout(r, randomDelay(1500, 3000)));

    // Try to search for a product
    console.log('\nSearching for "dress"...');

    // Find the search input with multiple selectors
    const searchSelectors = [
      'input[type="search"]',
      'input[placeholder*="Search"]',
      '.search-input',
      'input[name="search"]',
      'input[aria-label*="search"]',
      'input.search'
    ];

    let searchInputFound = false;
    for (const selector of searchSelectors) {
      try {
        const searchInput = await page.$(selector);
        if (searchInput) {
          console.log(`Found search input with selector: ${selector}`);

          // Move mouse to search input like a human would
          await page.hover(selector).catch(e => console.log('Hover error:', e.message));

          // Click on the search input
          await page.click(selector, { delay: randomDelay(50, 150) }).catch(e => console.log('Click error:', e.message));

          // Type the search query with human-like timing
          for (const char of 'dress') {
            await page.keyboard.type(char, { delay: randomDelay(50, 150) });
          }

          searchInputFound = true;
          break;
        }
      } catch (error) {
        console.log(`Error with selector ${selector}:`, error.message);
      }
    }

    if (!searchInputFound) {
      console.log('Search input not found, taking screenshot for debugging');
      await page.screenshot({ path: 'shein-search-input-not-found.png' });
    }

    // Random delay before pressing Enter
    await new Promise(r => setTimeout(r, randomDelay(500, 1500)));

    // Press Enter to search
    await page.keyboard.press('Enter').catch(e => console.log('Enter key error:', e.message));

    // Wait for the search results page to load with a random delay
    console.log('Waiting for search results...');
    await new Promise(resolve => setTimeout(resolve, randomDelay(3000, 7000)));

    // Check for CAPTCHA on search results page
    const hasCaptchaOnSearch = await checkForCaptcha(page);
    if (hasCaptchaOnSearch) {
      console.log('CAPTCHA detected on search results page!');
      await handleCaptcha(page);

      // Wait again after handling CAPTCHA
      await new Promise(resolve => setTimeout(resolve, randomDelay(2000, 4000)));
    }

    // Take a screenshot of the search results
    await page.screenshot({ path: 'shein-search-results-puppeteer.png' });
    console.log('Screenshot saved to shein-search-results-puppeteer.png');

    // Check if we can find any product elements using the exact selectors from the screenshot
    const productCount = await page.evaluate(() => {
      // Use the specific class seen in the screenshot
      const products = document.querySelectorAll('.s-product-card__img-container, .S-product-card__img-container');
      return products.length;
    });

    console.log(`Found ${productCount} product elements on the page`);

    // If we found products, extract some information
    if (productCount > 0) {
      console.log('\nExtracting product information...');

      const products = await page.evaluate(() => {
        // First try the exact selectors from the screenshot
        let productCards = document.querySelectorAll('.s-product-card__img-container, .S-product-card__img-container');

        // If no results, try alternative selectors
        if (productCards.length === 0) {
          productCards = document.querySelectorAll('[class*="product-card"], [class*="goods-item"], [data-goods-id]');
        }

        return Array.from(productCards).slice(0, 5).map(item => {
          // Get the parent product card element
          const productCard = item.closest('[data-goods-id]') ||
                             item.closest('[class*="product-card"]') ||
                             item.closest('[class*="goods-item"]') ||
                             item.closest('[data-spu-id]') ||
                             item;

          // Extract product ID from data attribute - try multiple possible attributes
          let goodsId = productCard.getAttribute('data-goods-id') ||
                       productCard.getAttribute('data-spu-id') ||
                       productCard.getAttribute('data-id') ||
                       productCard.getAttribute('id') ||
                       productCard.getAttribute('data-item-id') ||
                       productCard.getAttribute('data-product-id') ||
                       '';

          // If we couldn't find an ID in the attributes, try to extract it from the image URL
          if (!goodsId) {
            const imgEl = item.querySelector('img') || productCard.querySelector('img');
            if (imgEl && imgEl.src) {
              const imgUrl = imgEl.src;
              // Try to extract ID from image URL patterns like /images3_pi/2021/07/17/[ID]/
              const idMatch = imgUrl.match(/\/([^\/]+?)(?:_\w+)?\.jpg/) ||
                             imgUrl.match(/\/(\d+)\//) ||
                             imgUrl.match(/\/([a-zA-Z0-9]+)_[a-zA-Z0-9]+\.jpg/);

              if (idMatch && idMatch[1]) {
                goodsId = idMatch[1];
              }
            }
          }

          // If we still don't have an ID, try to extract it from any data attribute that looks like an ID
          if (!goodsId) {
            // Get all attributes of the product card
            const attributes = Array.from(productCard.attributes);
            for (const attr of attributes) {
              if (attr.name.includes('id') && attr.value && attr.value.length > 5) {
                goodsId = attr.value;
                break;
              }
            }
          }

          // Extract title - look for it in parent elements too
          let title = 'No title found';
          // Try to find title in data attributes first
          const titleAttr = productCard.getAttribute('data-goods-name') ||
                           productCard.getAttribute('data-title') ||
                           productCard.getAttribute('aria-label');

          if (titleAttr) {
            title = titleAttr;
          } else {
            // Look for title in child elements
            const titleEl = productCard.querySelector('[class*="name"], [class*="title"], h3, h4');
            if (titleEl) {
              title = titleEl.textContent.trim();
            }
          }

          // Extract price from data attributes first
          let price = 'No price found';
          const priceAttr = productCard.getAttribute('data-price') ||
                           productCard.getAttribute('data-us-price') ||
                           productCard.getAttribute('data-spu-price');

          if (priceAttr) {
            price = priceAttr;
          } else {
            // Look for price in child elements
            const priceEl = productCard.querySelector('[class*="price"], [data-price]');
            if (priceEl) {
              price = priceEl.textContent.trim();
            }
          }

          // Extract image URL
          let image = 'No image found';
          const imgEl = item.querySelector('img') || productCard.querySelector('img');
          if (imgEl) {
            image = imgEl.src || imgEl.getAttribute('data-src') || '';
          }

          // Construct product URL
          let url = 'No URL found';
          if (goodsId) {
            url = `https://ph.shein.com/products/${goodsId}`;
          } else {
            // Try to find URL in anchor tags
            const linkEl = productCard.querySelector('a');
            if (linkEl) {
              url = linkEl.href;

              // If URL is javascript:void(0), try to extract from other sources
              if (url === 'javascript:void(0)' || !url) {
                // Try to extract from data attributes
                const urlAttr = productCard.getAttribute('data-spu-url') ||
                               productCard.getAttribute('data-url');

                if (urlAttr) {
                  url = urlAttr.startsWith('http') ? urlAttr : `https://ph.shein.com${urlAttr}`;
                }
              }
            }
          }

          // Extract additional data
          const originalPrice = productCard.getAttribute('data-us-origin-price') ||
                               productCard.getAttribute('data-origin-price') || '';

          const discount = productCard.getAttribute('data-discount') || '';

          return {
            id: goodsId,
            title,
            price,
            originalPrice,
            discount,
            url,
            image
          };
        });
      });

      console.log('\nFirst 5 products:');
      products.forEach((product, index) => {
        console.log(`\nProduct ${index + 1}:`);
        console.log(`  ID: ${product.id || 'Not found'}`);
        console.log(`  Title: ${product.title}`);
        console.log(`  Price: ${product.price}`);
        if (product.originalPrice) {
          console.log(`  Original Price: ${product.originalPrice}`);
        }
        if (product.discount) {
          console.log(`  Discount: ${product.discount}`);
        }
        console.log(`  URL: ${product.url}`);
        console.log(`  Image: ${product.image ? product.image.substring(0, 50) + '...' : 'No image'}`);
      });
    } else {
      console.log('\nNo products found. This could be due to:');
      console.log('1. The search term not returning results');
      console.log('2. The selectors need to be updated');
      console.log('3. Shein might be blocking automated access with CAPTCHA');

      // Check if there's a CAPTCHA
      const hasCaptcha = await page.evaluate(() => {
        return document.body.textContent.includes('CAPTCHA') ||
               document.body.textContent.includes('captcha') ||
               document.body.textContent.includes('Please select') ||
               document.body.textContent.includes('verify') ||
               document.body.textContent.includes('Verify');
      });

      if (hasCaptcha) {
        console.log('\nCAPTCHA detected! Taking a screenshot...');
        await page.screenshot({ path: 'shein-captcha-puppeteer.png' });
        console.log('Screenshot saved to shein-captcha-puppeteer.png');
      }
    }
  } catch (error) {
    console.error('Error testing Shein with Puppeteer:', error);
  } finally {
    // Close the browser
    await browser.close();
    console.log('\n=== Shein Puppeteer Test Completed ===');
  }
}

// Run the test
testSheinWithPuppeteer().catch(console.error);
