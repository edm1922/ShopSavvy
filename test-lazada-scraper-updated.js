// Updated test script for the Lazada scraper
// This script uses CommonJS syntax for compatibility

// Import required modules
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Mock the HttpClient class
class HttpClient {
  constructor(options) {
    this.baseURL = options.baseURL || '';
    this.platform = options.platform || 'Unknown';
    this.rotateUserAgents = options.rotateUserAgents || false;
    this.requestDelay = options.requestDelay || 0;
    this.maxRetries = options.maxRetries || 3;
    
    // Create an axios instance
    this.axiosInstance = axios.create({
      baseURL: this.baseURL,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'max-age=0',
        'Connection': 'keep-alive',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
      },
    });
  }
  
  async get(url, config = {}) {
    try {
      // Add a delay if specified
      if (this.requestDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, this.requestDelay));
      }
      
      // Merge headers
      const mergedConfig = {
        ...config,
        headers: {
          ...this.axiosInstance.defaults.headers,
          ...config.headers,
        },
      };
      
      // Make the request
      const response = await this.axiosInstance.get(url, mergedConfig);
      
      // Save the response to a file for debugging
      const debugDir = path.join(__dirname, 'debug');
      if (!fs.existsSync(debugDir)) {
        fs.mkdirSync(debugDir);
      }
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = path.join(debugDir, `lazada-response-${timestamp}.html`);
      fs.writeFileSync(filename, response.data);
      console.log(`Response saved to ${filename}`);
      
      return response;
    } catch (error) {
      console.error(`Error making GET request to ${url}:`, error.message);
      throw error;
    }
  }
}

// Mock the LazadaScraper class
class LazadaScraper {
  constructor() {
    this.baseUrl = 'https://www.lazada.com.ph';
    this.searchUrl = '/catalog';
    this.productUrl = '/products';
    
    this.httpClient = new HttpClient({
      baseURL: this.baseUrl,
      platform: 'Lazada',
      rotateUserAgents: true,
      requestDelay: 1000,
      maxRetries: 3,
    });
  }
  
  async searchProducts(query, filters = {}) {
    try {
      console.log(`[LazadaScraper] Searching for: ${query}`, filters);
      
      // Build the search URL with query parameters
      let searchQueryUrl = `${this.searchUrl}/?q=${encodeURIComponent(query)}`;
      
      // Add filters if provided
      if (filters) {
        if (filters.minPrice) {
          searchQueryUrl += `&price=${filters.minPrice}-${filters.maxPrice || ''}`;
        }
        if (filters.brand) {
          searchQueryUrl += `&brand=${encodeURIComponent(filters.brand)}`;
        }
      }
      
      console.log(`[LazadaScraper] Making request to: ${this.baseUrl}${searchQueryUrl}`);
      
      // Make the request with additional headers to mimic a real browser
      const response = await this.httpClient.get(searchQueryUrl, {
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'max-age=0',
          'Connection': 'keep-alive',
          'Referer': this.baseUrl,
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'same-origin',
          'Sec-Fetch-User': '?1',
          'Upgrade-Insecure-Requests': '1',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        }
      });
      
      console.log(`[LazadaScraper] Response status: ${response.status}`);
      
      // Parse the HTML response
      const products = this.parseSearchResults(response.data);
      console.log(`[LazadaScraper] Found ${products.length} products`);
      
      return products;
    } catch (error) {
      console.error('Error searching Lazada products:', error.message);
      return [];
    }
  }
  
  parseSearchResults(html) {
    try {
      const $ = cheerio.load(html);
      const products = [];
      
      console.log('[LazadaScraper] Parsing search results...');
      
      // Try to find the script tag containing the product data
      let productData = [];
      
      $('script').each((_, element) => {
        const scriptContent = $(element).html() || '';
        if (scriptContent.includes('window.pageData')) {
          try {
            // Extract the JSON data using regex
            const match = scriptContent.match(/window\.pageData\s*=\s*({.*?});/s);
            if (match && match[1]) {
              const pageData = JSON.parse(match[1]);
              if (pageData && pageData.mods && pageData.mods.listItems) {
                productData = pageData.mods.listItems;
                console.log(`[LazadaScraper] Found ${productData.length} products in script data`);
              }
            }
          } catch (e) {
            console.error('Error parsing Lazada script data:', e.message);
          }
        }
      });
      
      // If we couldn't find the data in scripts, try to parse the HTML directly
      if (productData.length === 0) {
        console.log('[LazadaScraper] No product data found in scripts, trying to parse HTML directly');
        
        // Try different selectors for product cards
        const selectors = [
          '.Bm3ON', // Original selector
          '.c1_t2i', // Alternative selector
          '.c2prKC', // Another alternative
          '.c3KeDq', // Another alternative
          '.c16H9d', // Another alternative
          '[data-tracking="product-card"]', // Generic attribute
          '.card-product', // Generic class
          '.product-card', // Generic class
          '.item-card', // Generic class
        ];
        
        // Try each selector
        for (const selector of selectors) {
          console.log(`[LazadaScraper] Trying selector: ${selector}`);
          const elements = $(selector);
          console.log(`[LazadaScraper] Found ${elements.length} elements with selector ${selector}`);
          
          if (elements.length > 0) {
            elements.each((_, element) => {
              try {
                const itemElement = $(element);
                
                // Try different selectors for product data
                const titleSelectors = ['.RfADt', '.c16H9d', '.c3KeDq', '.title', 'h2', '.product-title', '.item-title'];
                const priceSelectors = ['.ooOxS', '.c3gUW0', '.price', '.product-price', '.item-price'];
                const imageSelectors = ['img', '.image img', '.product-image img', '.item-image img'];
                
                // Find the first matching selector
                const findText = (selectors) => {
                  for (const s of selectors) {
                    const text = itemElement.find(s).text().trim();
                    if (text) return text;
                  }
                  return '';
                };
                
                const findAttr = (selectors, attr) => {
                  for (const s of selectors) {
                    const value = itemElement.find(s).attr(attr);
                    if (value) return value;
                  }
                  return '';
                };
                
                // Extract the product data
                const productUrl = itemElement.find('a').attr('href') || '';
                const productId = this.extractProductIdFromUrl(productUrl);
                const title = findText(titleSelectors);
                const priceText = findText(priceSelectors);
                const imageUrl = findAttr(imageSelectors, 'src');
                
                if (title && priceText && productUrl) {
                  const product = {
                    id: productId,
                    title,
                    price: this.extractPrice(priceText),
                    productUrl: productUrl.startsWith('http') ? productUrl : this.baseUrl + productUrl,
                    platform: 'Lazada',
                    imageUrl,
                    // Additional fields if available
                    originalPrice: this.extractPrice(findText(['.WNoq3', '.original-price', '.old-price'])) || undefined,
                    discountPercentage: this.extractDiscountPercentage(findText(['.IcOsH', '.discount', '.discount-percentage'])) || undefined,
                    rating: parseFloat(itemElement.find('.rating').attr('data-rating') || '0') || undefined,
                    ratingCount: parseInt(findText(['.rating-count', '.review-count']).replace(/[^0-9]/g, '')) || undefined,
                    location: findText(['.oa6ri', '.location', '.seller-location']) || undefined,
                  };
                  
                  products.push(product);
                }
              } catch (error) {
                console.error('Error parsing Lazada product:', error.message);
              }
            });
            
            // If we found products with this selector, break the loop
            if (products.length > 0) {
              console.log(`[LazadaScraper] Successfully parsed ${products.length} products with selector ${selector}`);
              break;
            }
          }
        }
        
        // If we still couldn't find any products, try a more generic approach
        if (products.length === 0) {
          console.log('[LazadaScraper] No products found with specific selectors, trying generic approach');
          
          // Look for any elements that might be product cards
          $('a').each((_, element) => {
            try {
              const itemElement = $(element);
              const href = itemElement.attr('href') || '';
              
              // Check if this looks like a product URL
              if (href.includes('/products/') || (href.includes('-i') && href.includes('-s'))) {
                const productUrl = href;
                const productId = this.extractProductIdFromUrl(productUrl);
                
                // Look for title and price near this element
                const title = itemElement.text().trim() || itemElement.find('h2, .title, .name').text().trim();
                const priceElement = itemElement.find('.price, [data-price], [class*="price"]');
                const priceText = priceElement.text().trim();
                const imageUrl = itemElement.find('img').attr('src') || '';
                
                if (title && priceText && productUrl) {
                  const product = {
                    id: productId,
                    title,
                    price: this.extractPrice(priceText),
                    productUrl: productUrl.startsWith('http') ? productUrl : this.baseUrl + productUrl,
                    platform: 'Lazada',
                    imageUrl,
                  };
                  
                  products.push(product);
                }
              }
            } catch (error) {
              console.error('Error parsing Lazada product with generic approach:', error.message);
            }
          });
        }
      } else {
        // Parse the product data from the JSON
        productData.forEach(item => {
          try {
            const product = {
              id: item.itemId || item.nid || '',
              title: item.name || '',
              price: parseFloat(item.price) || 0,
              productUrl: this.baseUrl + (item.productUrl || item.itemUrl || ''),
              platform: 'Lazada',
              imageUrl: item.image || '',
              // Additional fields if available
              originalPrice: item.originalPrice ? parseFloat(item.originalPrice) : undefined,
              discountPercentage: item.discount ? parseFloat(item.discount) : undefined,
              rating: item.ratingScore ? parseFloat(item.ratingScore) : undefined,
              ratingCount: item.review ? parseInt(item.review) : undefined,
              location: item.location || undefined,
              sales: item.sold ? parseInt(item.sold) : undefined,
            };
            
            products.push(product);
          } catch (error) {
            console.error('Error parsing Lazada product from JSON:', error.message);
          }
        });
      }
      
      console.log(`[LazadaScraper] Returning ${products.length} products`);
      return products;
    } catch (error) {
      console.error('Error parsing Lazada search results:', error.message);
      return [];
    }
  }
  
  extractProductIdFromUrl(url) {
    // Example URL: /products/i123456789-s987654321.html
    const match = url.match(/\/products\/i(\d+)-s(\d+)\.html/);
    if (match && match[1] && match[2]) {
      return `${match[1]}_${match[2]}`;
    }
    
    // Alternative format: /product-name-i123456789-s987654321.html
    const altMatch = url.match(/\/.*?-i(\d+)-s(\d+)\.html/);
    if (altMatch && altMatch[1] && altMatch[2]) {
      return `${altMatch[1]}_${altMatch[2]}`;
    }
    
    // If no match, return the whole URL as ID
    return url;
  }
  
  extractPrice(priceString) {
    if (!priceString) return 0;
    // Remove currency symbols and non-numeric characters except for decimal point
    const price = parseFloat(priceString.replace(/[^\d.]/g, ''));
    return isNaN(price) ? 0 : price;
  }
  
  extractDiscountPercentage(discountString) {
    if (!discountString) return undefined;
    // Extract percentage value from strings like "-20%" or "20% OFF"
    const match = discountString.match(/(\d+)%/);
    if (match && match[1]) {
      return parseInt(match[1]);
    }
    return undefined;
  }
}

// Test the Lazada scraper
async function testLazadaScraper() {
  console.log('Testing Lazada Scraper...');
  
  const scraper = new LazadaScraper();
  
  console.log('\n1. Testing searchProducts...');
  try {
    const query = 'smartphone';
    console.log(`Searching for: ${query}`);
    
    const products = await scraper.searchProducts(query);
    
    console.log(`Found ${products.length} products`);
    if (products.length > 0) {
      console.log('First product:');
      console.log(JSON.stringify(products[0], null, 2));
    }
  } catch (error) {
    console.error('Error searching products:', error.message);
  }
  
  console.log('\n2. Testing searchProducts with filters...');
  try {
    const query = 'smartphone';
    const filters = {
      minPrice: 5000,
      maxPrice: 20000,
      brand: 'Samsung'
    };
    
    console.log(`Searching for: ${query} with filters:`, filters);
    
    const products = await scraper.searchProducts(query, filters);
    
    console.log(`Found ${products.length} products`);
    if (products.length > 0) {
      console.log('First product:');
      console.log(JSON.stringify(products[0], null, 2));
    }
  } catch (error) {
    console.error('Error searching products with filters:', error.message);
  }
  
  console.log('\nLazada Scraper test completed!');
}

// Run the test
testLazadaScraper();
