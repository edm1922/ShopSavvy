/**
 * Test script to check if we can get results from Shopee using Serper.dev API
 */

const axios = require('axios');

// Serper.dev API configuration
const SERPER_API_URL = 'https://google.serper.dev/shopping';
const SERPER_API_KEY = process.env.SERPER_API_KEY || '3986a10df3a191c663afa1d08d3929d1a47fb875';

// Test queries for fashion items
const TEST_QUERIES = [
  'dress',
  'shoes',
  'shirt',
  'bag',
  'watch'
];

/**
 * Search for products using Serper.dev API
 * 
 * @param {string} query - The search query
 * @returns {Promise<Array>} - Array of shopping results
 */
async function searchShopeeProducts(query) {
  console.log(`Searching for "${query} shopee philippines"...`);
  
  try {
    const response = await axios.post(
      SERPER_API_URL,
      {
        q: `${query} shopee philippines`,
        gl: 'ph',
        hl: 'en'
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
    console.log(`Found ${shoppingResults.length} total results`);
    
    // Filter for Shopee results
    const shopeeResults = shoppingResults.filter(item => 
      (item.source || '').toLowerCase().includes('shopee')
    );
    
    console.log(`Found ${shopeeResults.length} Shopee results`);
    
    // Print the first few Shopee results
    if (shopeeResults.length > 0) {
      console.log('\nSample Shopee products:');
      shopeeResults.slice(0, 3).forEach((item, index) => {
        console.log(`${index + 1}. ${item.title} - ${item.price}`);
        console.log(`   Source: ${item.source}`);
        console.log(`   Link: ${item.link}`);
        console.log('');
      });
    }
    
    return shopeeResults;
  } catch (error) {
    console.error(`Error searching for "${query}":`, error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
    }
    return [];
  }
}

/**
 * Main function to test Shopee search
 */
async function testShopeeSearch() {
  console.log('Starting Shopee search test...');
  
  let totalResults = 0;
  
  // Run searches for all test queries
  for (const query of TEST_QUERIES) {
    const results = await searchShopeeProducts(query);
    totalResults += results.length;
    
    // Add a delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\nTest completed. Found a total of ${totalResults} Shopee products across all queries.`);
  
  if (totalResults > 0) {
    console.log('✅ Shopee products can be found using Serper.dev API.');
  } else {
    console.log('❌ No Shopee products found. Consider using a different platform.');
  }
}

// Run the test
testShopeeSearch().catch(error => {
  console.error('Error running test:', error);
});
