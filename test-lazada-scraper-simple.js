// Simple test script for the Lazada scraper
// This script uses CommonJS syntax for compatibility

// Import required modules
const axios = require('axios');
const cheerio = require('cheerio');

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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });
  }
  
  async get(url, config = {}) {
    try {
      // Add a delay if specified
      if (this.requestDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, this.requestDelay));
      }
      
      // Make the request
      const response = await this.axiosInstance.get(url, config);
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
      
      console.log(`Making request to: ${this.baseUrl}${searchQueryUrl}`);
      
      // Make the request
      const response = await this.httpClient.get(searchQueryUrl);
      
      // Parse the HTML response
      return this.parseSearchResults(response.data);
    } catch (error) {
      console.error('Error searching Lazada products:', error.message);
      return [];
    }
  }
  
  parseSearchResults(html) {
    try {
      const $ = cheerio.load(html);
      const products = [];
      
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
                console.log(`Found ${productData.length} products in script data`);
              }
            }
          } catch (e) {
            console.error('Error parsing Lazada script data:', e.message);
          }
        }
      });
      
      // If we found product data in scripts, parse it
      if (productData.length > 0) {
        productData.forEach(item => {
          try {
            const product = {
              id: item.itemId || item.nid || '',
              title: item.name || '',
              price: parseFloat(item.price) || 0,
              productUrl: this.baseUrl + (item.productUrl || item.itemUrl || ''),
              platform: 'Lazada',
              imageUrl: item.image || '',
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
      } else {
        // If we couldn't find the data in scripts, try to parse the HTML directly
        console.log('No product data found in scripts, trying to parse HTML directly');
        
        $('.Bm3ON').each((_, element) => {
          try {
            const itemElement = $(element);
            
            // Extract the product data
            const productUrl = itemElement.find('a').attr('href') || '';
            const productId = this.extractProductIdFromUrl(productUrl);
            
            const product = {
              id: productId,
              title: itemElement.find('.RfADt').text().trim(),
              price: this.extractPrice(itemElement.find('.ooOxS').text()),
              productUrl: this.baseUrl + productUrl,
              platform: 'Lazada',
              imageUrl: itemElement.find('img').attr('src') || '',
              originalPrice: this.extractPrice(itemElement.find('.WNoq3').text()) || undefined,
              discountPercentage: this.extractDiscountPercentage(itemElement.find('.IcOsH').text()) || undefined,
              rating: parseFloat(itemElement.find('.mOmOe').attr('aria-label')?.replace(/[^0-9.]/g, '') || '0') || undefined,
              ratingCount: parseInt(itemElement.find('.mOmOe').next().text().replace(/[^0-9]/g, '')) || undefined,
              location: itemElement.find('.oa6ri').text().trim() || undefined,
            };
            
            products.push(product);
          } catch (error) {
            console.error('Error parsing Lazada product from HTML:', error.message);
          }
        });
      }
      
      console.log(`Returning ${products.length} products`);
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
    // Remove currency symbols and non-numeric characters except for decimal point
    const price = parseFloat(priceString.replace(/[^\d.]/g, ''));
    return isNaN(price) ? 0 : price;
  }
  
  extractDiscountPercentage(discountString) {
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
