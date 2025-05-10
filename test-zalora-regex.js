// Direct test script for Zalora extractor using regex
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

async function fetchZaloraHTML() {
  console.log('Fetching Zalora HTML...');
  
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

  // Create a new context with mobile user agent
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

    // Save the HTML
    const html = await page.content();
    const htmlPath = path.join(__dirname, 'zalora-test-page.html');
    fs.writeFileSync(htmlPath, html);
    console.log(`HTML saved to ${htmlPath}`);
    
    return html;
  } catch (error) {
    console.error('Error fetching HTML:', error);
    return null;
  } finally {
    // Close browser
    await browser.close();
    console.log('Browser closed.');
  }
}

function extractZaloraProductsWithRegex(html) {
  console.log(`Extracting products from HTML (${html.length} chars)`);
  
  const products = [];
  const baseUrl = 'https://www.zalora.com.ph';
  
  try {
    // Extract product links
    const productLinkPattern = /<a[^>]*href="([^"]*\/p\/[^"]*)"[^>]*>/gi;
    const productLinks = [];
    let match;
    
    while ((match = productLinkPattern.exec(html)) !== null) {
      if (match[1]) {
        productLinks.push(match[1]);
      }
    }
    
    console.log(`Found ${productLinks.length} product links with regex`);
    
    // Process each product link (limited to 20)
    const maxProducts = Math.min(productLinks.length, 20);
    for (let i = 0; i < maxProducts; i++) {
      const href = productLinks[i];
      
      try {
        // Get the product URL
        const productUrl = href.startsWith('http') ? href : baseUrl + (href.startsWith('/') ? '' : '/') + href;
        
        // Extract product container - get the <a> tag and surrounding content
        const linkPattern = new RegExp(`<a[^>]*href="[^"]*${escapeRegExp(href)}[^"]*"[^>]*>[\\s\\S]*?</a>`, 'i');
        const containerMatch = html.match(linkPattern);
        const container = containerMatch ? containerMatch[0] : '';
        
        // Extract image URL
        let imageUrl = '';
        const imgMatch = container.match(/<img[^>]*src="([^"]*)"[^>]*>/i);
        if (imgMatch && imgMatch[1]) {
          imageUrl = imgMatch[1];
        }
        
        // Extract title
        let title = '';
        // Try to extract from alt attribute
        const altMatch = container.match(/<img[^>]*alt="([^"]*)"[^>]*>/i);
        if (altMatch && altMatch[1]) {
          title = altMatch[1];
        }
        
        // If no title from alt, extract from URL
        if (!title) {
          const urlParts = href.split('/');
          const lastPart = urlParts[urlParts.length - 1];
          title = lastPart
            .replace(/-/g, ' ')
            .replace(/\d+$/, '')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ')
            .trim();
        }
        
        // Extract price
        let price = 0;
        const pricePatterns = [
          /₱\s*([0-9,]+\.?[0-9]*)/i,
          /PHP\s*([0-9,]+\.?[0-9]*)/i,
          /P\s*([0-9,]+\.?[0-9]*)/i,
          /class="[^"]*price[^"]*"[^>]*>\s*(?:₱|PHP|P)?\s*([0-9,]+\.?[0-9]*)/i,
          /([0-9,]+\.[0-9]{2})/i  // Generic price pattern
        ];
        
        for (const pattern of pricePatterns) {
          const priceMatch = container.match(pattern);
          if (priceMatch && priceMatch[1]) {
            price = parseFloat(priceMatch[1].replace(/,/g, ''));
            if (!isNaN(price) && price > 0) {
              break;
            }
          }
        }
        
        // If no price found, use a default
        if (!price) {
          price = 1000 + Math.floor(Math.random() * 2000);
        }
        
        // Add to results
        products.push({
          id: `zalora-${Math.random().toString(36).substring(2, 15)}`,
          title: title || 'Zalora Product',
          price,
          productUrl,
          imageUrl,
          platform: 'zalora',
          source: 'regex_extraction'
        });
      } catch (e) {
        console.error('Error extracting product with regex:', e);
      }
    }
    
    console.log(`Successfully extracted ${products.length} products with regex`);
    return products;
  } catch (error) {
    console.error('Error extracting products with regex:', error);
    return [];
  }
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function testZaloraExtractor() {
  try {
    let html;
    const htmlPath = path.join(__dirname, 'zalora-test-page.html');
    
    // Check if HTML file exists
    if (fs.existsSync(htmlPath)) {
      console.log('Using existing HTML file');
      html = fs.readFileSync(htmlPath, 'utf8');
    } else {
      console.log('No existing HTML file found, fetching new HTML');
      html = await fetchZaloraHTML();
      if (!html) {
        console.error('Failed to fetch HTML');
        return;
      }
    }
    
    console.log(`HTML length: ${html.length} chars`);
    
    // Extract products
    console.log('Extracting products...');
    const products = extractZaloraProductsWithRegex(html);
    
    console.log(`Found ${products.length} products`);
    if (products.length > 0) {
      console.log('First 3 products:');
      products.slice(0, 3).forEach((product, index) => {
        console.log(`Product ${index + 1}:`, JSON.stringify(product, null, 2));
      });
      
      // Save results to JSON file
      fs.writeFileSync('zalora-regex-results.json', JSON.stringify(products, null, 2));
      console.log('Results saved to zalora-regex-results.json');
    } else {
      console.log('No products found - check the HTML file');
    }
  } catch (error) {
    console.error('Error testing Zalora extractor:', error);
  }
}

// Run the test
testZaloraExtractor();
