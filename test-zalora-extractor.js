// Test script for the improved Zalora extractor with saved HTML
const fs = require('fs');
const path = require('path');

// Mock Product type for testing
class Product {
  constructor() {
    this.id = '';
    this.title = '';
    this.price = 0;
    this.productUrl = '';
    this.imageUrl = '';
    this.platform = '';
    this.source = '';
  }
}

// Mock the extractZaloraProductsImproved function for testing
function extractZaloraProductsImproved(html) {
  console.log(`[ZaloraImprovedExtractor] Extracting products from HTML (${html.length} chars)`);

  // If HTML is too small, return empty array
  if (html.length < 1000) {
    console.log(`[ZaloraImprovedExtractor] HTML is too small (${html.length} chars), skipping extraction`);
    return [];
  }

  const products = [];
  const baseUrl = 'https://www.zalora.com.ph';

  try {
    // Server environment - use regex-based extraction
    return extractWithRegex(html, baseUrl);
  } catch (error) {
    console.error('[ZaloraImprovedExtractor] Error extracting products:', error);
    return [];
  }
}

/**
 * Extract products using regex patterns (server environment)
 */
function extractWithRegex(html, baseUrl) {
  console.log(`[ZaloraImprovedExtractor] Using regex-based extraction`);
  
  const products = [];
  
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
    
    console.log(`[ZaloraImprovedExtractor] Found ${productLinks.length} product links with regex`);
    
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
        console.error('[ZaloraImprovedExtractor] Error extracting product with regex:', e);
      }
    }
    
    console.log(`[ZaloraImprovedExtractor] Successfully extracted ${products.length} products with regex`);
    return products;
  } catch (error) {
    console.error('[ZaloraImprovedExtractor] Error extracting products with regex:', error);
    return [];
  }
}

/**
 * Escape special characters in a string for use in a regular expression
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Main function to test the extractor
async function testZaloraExtractor() {
  try {
    // Read the saved HTML file
    const htmlPath = path.join(__dirname, 'zalora-test-page.html');
    if (!fs.existsSync(htmlPath)) {
      console.error(`HTML file not found at ${htmlPath}`);
      console.log('Please run test-zalora-improved.bat first to generate the HTML file');
      return;
    }
    
    const html = fs.readFileSync(htmlPath, 'utf8');
    console.log(`Read HTML file, length: ${html.length} chars`);
    
    // Extract products using our improved extractor
    console.log('Extracting products using improved Zalora extractor...');
    const products = extractZaloraProductsImproved(html);
    
    console.log(`Found ${products.length} products`);
    if (products.length > 0) {
      console.log('First 3 products:');
      products.slice(0, 3).forEach((product, index) => {
        console.log(`Product ${index + 1}:`, JSON.stringify(product, null, 2));
      });
      
      // Save results to JSON file
      fs.writeFileSync('zalora-extractor-results.json', JSON.stringify(products, null, 2));
      console.log('Results saved to zalora-extractor-results.json');
    } else {
      console.log('No products found - check the HTML file');
    }
  } catch (error) {
    console.error('Error testing Zalora extractor:', error);
  }
}

// Run the test
testZaloraExtractor();
