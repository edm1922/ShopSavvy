/**
 * Test script for the Serper.dev API
 * 
 * This script tests the Serper.dev API for product search functionality.
 * 
 * Usage: node scripts/test-serper-api.js [query]
 * Example: node scripts/test-serper-api.js "iPhone 15"
 */

const axios = require('axios');

// Serper.dev API configuration
const SERPER_API_URL = 'https://google.serper.dev/shopping';
const SERPER_API_KEY = '3986a10df3a191c663afa1d08d3929d1a47fb875';

/**
 * Search for products using Serper.dev API
 * 
 * @param {string} query The search query
 * @param {Object} options Search options
 * @returns {Promise<Array>} Array of products
 */
async function searchProducts(query, options = {}) {
  const {
    country = 'ph',
    language = 'en',
    maxResults = 20
  } = options;

  console.log(`Searching for "${query}" with options:`, options);

  try {
    // Call the Serper.dev API
    const response = await axios.post(
      SERPER_API_URL,
      {
        q: query,
        gl: country,
        hl: language
      },
      {
        headers: {
          'X-API-KEY': SERPER_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    // Extract shopping results
    const shoppingResults = response.data.shopping || [];
    console.log(`Found ${shoppingResults.length} results`);

    // Return the results (limited by maxResults)
    return shoppingResults.slice(0, maxResults);
  } catch (error) {
    console.error('Error searching products:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return [];
  }
}

/**
 * Main function
 */
async function main() {
  // Get the search query from command line arguments
  const query = process.argv[2] || 'smartphone';

  console.log(`Testing Serper.dev API with query: "${query}"`);

  // Search for products
  const products = await searchProducts(query);

  // Display the results
  if (products.length > 0) {
    console.log('\nSearch Results:');
    products.forEach((product, index) => {
      console.log(`\n[${index + 1}] ${product.title}`);
      console.log(`  Price: ${product.price}`);
      console.log(`  Source: ${product.source}`);
      console.log(`  Link: ${product.link}`);
      if (product.rating) {
        console.log(`  Rating: ${product.rating} (${product.ratingCount} reviews)`);
      }
    });
  } else {
    console.log('No products found');
  }
}

// Run the main function
main().catch(console.error);
