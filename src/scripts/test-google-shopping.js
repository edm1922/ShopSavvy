/**
 * Test script for Google Shopping scraping.
 *
 * This script tests the feasibility of using Google Shopping as a proxy
 * to get Shopee product data.
 */

const { chromium } = require('playwright');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Function to extract price from a price string
function extractPrice(priceString) {
  try {
    // Remove currency symbols and non-numeric characters except for decimal points
    const cleanedPrice = priceString.replace(/[^\d.]/g, '');
    return parseFloat(cleanedPrice) || 0;
  } catch (error) {
    console.error('Error extracting price:', error);
    return 0;
  }
}

// Main function to test Google Shopping scraping
async function testGoogleShopping() {
  console.log('Starting Google Shopping test...');

  const browser = await chromium.launch({
    headless: false, // Set to false to see the browser in action
  });

  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      viewport: { width: 1280, height: 800 },
    });

    const page = await context.newPage();

    // Search query
    const query = 'Arduino';
    const targetPlatform = 'Shopee';

    // Build the search URL
    const searchUrl = `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(query + " " + targetPlatform)}`;
    console.log(`Navigating to: ${searchUrl}`);

    // Navigate to the search page
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });

    // Wait for the page to load
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
      console.log('Timeout waiting for network idle, continuing anyway');
    });

    // Take a screenshot for debugging
    const screenshotPath = path.join(process.cwd(), 'google-shopping-test.png');
    await page.screenshot({ path: screenshotPath });
    console.log(`Saved screenshot to: ${screenshotPath}`);

    // Get the HTML content
    const content = await page.content();

    // Save the HTML content for debugging
    const htmlPath = path.join(process.cwd(), 'google-shopping-test.html');
    fs.writeFileSync(htmlPath, content);
    console.log(`Saved HTML to: ${htmlPath}`);

    // Use cheerio to parse the HTML
    const $ = cheerio.load(content);
    const extractedProducts = [];

    // Google Shopping product selectors
    const productSelectors = [
      'div[data-sh-dgr]',
      '.sh-dgr__grid-result',
      '.sh-dlr__list-result',
      '.shopping-result',
      '.commercial-unit-desktop-top',
      '.pla-unit',
      'div[data-docid]',
      'div.mnr-c',
      'div.g',
      'div.sh-dlr__content',
      'div.sh-dlr__offer',
      'div.sh-pr__product-results-grid',
      'div.sh-pr__product-result',
      'div[data-hveid]',
    ];

    // Try each selector
    for (const selector of productSelectors) {
      console.log(`Trying selector: ${selector}`);
      const elements = $(selector);
      console.log(`Found ${elements.length} elements with selector ${selector}`);

      if (elements.length > 0) {
        elements.each((_, element) => {
          try {
            const el = $(element);

            // Extract product data with more flexible selectors
            let title = '';
            let priceText = '';
            let merchantText = '';
            let productUrl = '';
            let imageUrl = '';

            // Try different title selectors
            const titleSelectors = [
              'h3', '.sh-dgr__product-title', '.plantl',
              '[data-title]', '[data-product-title]',
              'div[role="heading"]', 'a[aria-label]',
              'div[class*="title"]', 'span[class*="title"]',
              'div[class*="name"]', 'span[class*="name"]',
              'div[class*="product"]', 'span[class*="product"]'
            ];

            for (const selector of titleSelectors) {
              const foundTitle = el.find(selector).first().text().trim();
              if (foundTitle) {
                title = foundTitle;
                break;
              }
            }

            // Try different price selectors
            const priceSelectors = [
              '.a8Pemb', '.sh-dgr__offer-price', '.PZPZlf',
              '[data-price]', '[data-product-price]',
              'div[class*="price"]', 'span[class*="price"]',
              'div[class*="cost"]', 'span[class*="cost"]',
              'div[class*="amount"]', 'span[class*="amount"]'
            ];

            for (const selector of priceSelectors) {
              const foundPrice = el.find(selector).first().text().trim();
              if (foundPrice) {
                priceText = foundPrice;
                break;
              }
            }

            // Try different merchant selectors
            const merchantSelectors = [
              '.aULzUe', '.E5ocAb', '.IuHnof',
              '[data-merchant]', '[data-store]', '[data-seller]',
              'div[class*="merchant"]', 'span[class*="merchant"]',
              'div[class*="store"]', 'span[class*="store"]',
              'div[class*="seller"]', 'span[class*="seller"]',
              'div[class*="shop"]', 'span[class*="shop"]'
            ];

            for (const selector of merchantSelectors) {
              const foundMerchant = el.find(selector).first().text().trim();
              if (foundMerchant) {
                merchantText = foundMerchant;
                break;
              }
            }

            // Extract product URL
            el.find('a').each((_, anchor) => {
              const href = $(anchor).attr('href');
              if (href && href.startsWith('http') && !productUrl) {
                productUrl = href;
              }
            });

            // Extract image URL
            el.find('img').each((_, img) => {
              const src = $(img).attr('src');
              if (src && !src.includes('data:image') && !imageUrl) {
                imageUrl = src;
              }
            });

            // If we have at least a title, create a product
            if (title) {
              const product = {
                title,
                price: extractPrice(priceText),
                merchant: merchantText,
                productUrl: productUrl || '#',
                imageUrl: imageUrl || '',
                html: el.html().substring(0, 200) + '...' // Include a snippet of the HTML for debugging
              };

              extractedProducts.push(product);
            }
          } catch (error) {
            console.error('Error parsing Google Shopping product:', error);
          }
        });

        // If we found products with this selector, break the loop
        if (extractedProducts.length > 0) {
          console.log(`Successfully parsed ${extractedProducts.length} products with selector ${selector}`);
          break;
        }
      }
    }

    // Print the results
    console.log(`Found ${extractedProducts.length} products`);
    console.log(JSON.stringify(extractedProducts, null, 2));

    // Save the results to a file
    const resultsPath = path.join(process.cwd(), 'google-shopping-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(extractedProducts, null, 2));
    console.log(`Saved results to: ${resultsPath}`);

    // Check if any Shopee products were found
    const shopeeProducts = extractedProducts.filter(product =>
      product.merchant.toLowerCase().includes('shopee') ||
      product.productUrl.toLowerCase().includes('shopee')
    );

    console.log(`Found ${shopeeProducts.length} Shopee products`);

    if (shopeeProducts.length > 0) {
      console.log('Shopee products found! Google Shopping can be used as a proxy.');
    } else {
      console.log('No Shopee products found. Google Shopping might not be a viable proxy.');
    }

  } catch (error) {
    console.error('Error testing Google Shopping:', error);
  } finally {
    // Close the browser
    await browser.close();
  }
}

// Run the test
testGoogleShopping().catch(console.error);
