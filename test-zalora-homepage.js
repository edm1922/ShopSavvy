// Simplified Zalora test script
const { chromium } = require('playwright');
const fs = require('fs');

async function testZaloraHomepageSearch() {
  console.log('Starting simplified Zalora test...');

  // Basic browser launch
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Go directly to search results
    console.log('Navigating to search results...');
    await page.goto('https://www.zalora.com.ph/search?q=shoes', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Don't wait for specific selectors, just wait for the page to load
    console.log('Waiting for page to load...');
    await page.waitForTimeout(5000);

    // Try multiple selectors for product cards
    console.log('Looking for product cards...');
    const productSelectors = [
      '[data-ga-ecommerce*="product"]',
      '.product-card',
      '.catalog-product',
      '[itemtype="http://schema.org/Product"]'
    ];

    let productsFound = 0;
    for (const selector of productSelectors) {
      try {
        await page.waitForSelector(selector, {
          timeout: 15000,
          state: 'attached'
        });
        productsFound = (await page.$$(selector)).length;
        if (productsFound > 0) {
          console.log(`Found ${productsFound} products using selector: ${selector}`);
          break;
        }
      } catch (err) {
        console.log(`No products found with selector ${selector}`);
      }
    }

    if (productsFound === 0) {
      console.log('Could not find any product cards - site may be blocking requests');
      // Save screenshot for debugging
      await page.screenshot({ path: 'zalora-blocked.png', fullPage: true });
      console.log('Screenshot saved to zalora-blocked.png');
    }

    // Skip screenshot to avoid timeouts
    console.log('Skipping search results screenshot to avoid timeouts');

    // Extract products from the search results page with retry logic
    console.log('Extracting products from search results...');
    const searchProducts = await extractProductsWithRetry(page);

    async function extractProductsWithRetry(page, retries = 3) {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const products = await page.evaluate(async () => {
            const products = [];
            const baseUrl = 'https://www.zalora.com.ph';

            // Look for product links directly - this is the most reliable approach
            const productLinks = document.querySelectorAll('a[href*="/p/"]');
            console.log(`Found ${productLinks.length} product links with href containing /p/`);

            // Process each product link
            for (const productLink of productLinks) {
              try {
                // Get the product URL directly from the link
                const href = productLink.getAttribute('href') || '';
                const productUrl = href.startsWith('http') ? href : baseUrl + href;

                // Use the link or its parent as the card
                const card = productLink.closest('[class*="product"], [class*="card"], [class*="item"]') ||
                             productLink.parentElement || productLink;

                // Get product image
                const img = card.querySelector('img');
                const imageUrl = img ? (img.getAttribute('src') || img.getAttribute('data-src') || '') : '';

                // Get product title
                const titleEl = card.querySelector('[itemprop="name"]') || card.querySelector('.product-name');
                const title = titleEl ? titleEl.textContent.trim() : '';

                // Get brand
                const brandEl = card.querySelector('[itemprop="brand"]') || card.querySelector('.product-brand');
                const brand = brandEl ? brandEl.textContent.trim() : '';

                // Get price
                const priceEl = card.querySelector('[itemprop="price"]') || card.querySelector('.product-price');
                const priceText = priceEl ? priceEl.textContent.trim() : '';
                const price = priceText ? parseFloat(priceText.replace(/[^\d.]/g, '')) : 0;

                // Get original price if discounted
                const originalPriceEl = card.querySelector('.original-price') || card.querySelector('.price-before');
                const originalPriceText = originalPriceEl ? originalPriceEl.textContent.trim() : '';
                const originalPrice = originalPriceText ? parseFloat(originalPriceText.replace(/[^\d.]/g, '')) : price;

                // Get discount percentage if available
                const discountEl = card.querySelector('.discount-percentage');
                const discount = discountEl ? discountEl.textContent.trim() : '';

                // Get rating
                const ratingEl = card.querySelector('[itemprop="ratingValue"]') || card.querySelector('.product-rating');
                const rating = ratingEl ? parseFloat(ratingEl.textContent.trim()) : 0;

                // Get review count
                const reviewCountEl = card.querySelector('[itemprop="reviewCount"]') || card.querySelector('.product-review-count');
                const reviewCount = reviewCountEl ? parseInt(reviewCountEl.textContent.trim().replace(/[^\d]/g, '')) : 0;

                // Only add if we have essential data
                if (productUrl && title) {
                  products.push({
                    id: `zalora-${Math.random().toString(36).substring(2, 15)}`,
                    title,
                    brand,
                    price,
                    originalPrice,
                    discount,
                    rating,
                    reviewCount,
                    productUrl,
                    imageUrl,
                    platform: 'zalora',
                    source: 'homepage_search'
                  });
                }
              } catch (e) {
                console.error('Error extracting product:', e);
              }
            }
            return products;
          });

          console.log(`Extracted ${products.length} products on attempt ${attempt}`);
          if (products.length > 0) {
            return products;
          }
        } catch (e) {
          console.error(`Attempt ${attempt} failed:`, e);
        }

        // Wait before retrying
        if (attempt < retries) {
          console.log(`Waiting 3 seconds before retry...`);
          await page.waitForTimeout(3000);
        }
      }
      return [];
    }

    console.log(`Found ${searchProducts.length} products from search results`);
    if (searchProducts.length > 0) {
      console.log('First 3 products with full details:');
      searchProducts.slice(0, 3).forEach((product, index) => {
        console.log(`Product ${index + 1}:`, JSON.stringify(product, null, 2));
      });

      // Save results to JSON file
      fs.writeFileSync('zalora-search-results.json', JSON.stringify(searchProducts, null, 2));
      console.log('Results saved to zalora-search-results.json');

      // Handle pagination if needed
      const nextPageButton = await page.$('.next-page');
      if (nextPageButton) {
        console.log('Next page available, clicking...');
        await nextPageButton.click();
        await page.waitForTimeout(3000);

        // Recursively get next page products
        const nextPageProducts = await extractProductsWithRetry(page);
        searchProducts.push(...nextPageProducts);
        console.log(`Total products after pagination: ${searchProducts.length}`);
      }
    }

    // Save the HTML for inspection
    const html = await page.content();
    fs.writeFileSync('zalora-homepage-search.html', html);
    console.log('HTML saved to zalora-homepage-search.html');

    console.log('Test complete with enhanced data extraction.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close browser
    await browser.close();
    console.log('Browser closed.');
  }
}

testZaloraHomepageSearch().catch(console.error);
