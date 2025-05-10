/**
 * Test script to check if we can get results from all supported platforms using Serper.dev API
 */

const axios = require('axios');

// Serper.dev API configuration
const SERPER_API_URL = 'https://google.serper.dev/shopping';
const SERPER_API_KEY = process.env.SERPER_API_KEY || '3986a10df3a191c663afa1d08d3929d1a47fb875';

// Supported platforms
const PLATFORMS = [
  'shopee',
  'lazada',
  'zalora',
  'shein'
];

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
 * @param {string} platform - The platform to search for
 * @returns {Promise<Array>} - Array of platform-specific results
 */
async function searchPlatformProducts(query, platform) {
  console.log(`Searching for "${query} ${platform} philippines"...`);
  
  try {
    const response = await axios.post(
      SERPER_API_URL,
      {
        q: `${query} ${platform} philippines`,
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
    
    // Filter for platform-specific results
    const platformResults = shoppingResults.filter(item => 
      (item.source || '').toLowerCase().includes(platform)
    );
    
    console.log(`Found ${platformResults.length} ${platform} results`);
    
    // Print the first few platform results
    if (platformResults.length > 0) {
      console.log(`\nSample ${platform} products:`);
      platformResults.slice(0, 2).forEach((item, index) => {
        console.log(`${index + 1}. ${item.title} - ${item.price}`);
        console.log(`   Source: ${item.source}`);
        console.log('');
      });
    }
    
    return platformResults;
  } catch (error) {
    console.error(`Error searching for "${query} on ${platform}":`, error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
    }
    return [];
  }
}

/**
 * Main function to test all platforms
 */
async function testAllPlatforms() {
  console.log('Starting platform search test...');
  
  const results = {};
  
  // Initialize results object
  PLATFORMS.forEach(platform => {
    results[platform] = {
      totalResults: 0,
      queriesWithResults: 0,
      queriesTested: 0
    };
  });
  
  // Test each platform with each query
  for (const platform of PLATFORMS) {
    console.log(`\n=== Testing ${platform.toUpperCase()} ===\n`);
    
    for (const query of TEST_QUERIES) {
      const platformResults = await searchPlatformProducts(query, platform);
      
      results[platform].totalResults += platformResults.length;
      results[platform].queriesTested++;
      
      if (platformResults.length > 0) {
        results[platform].queriesWithResults++;
      }
      
      // Add a delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  // Print summary
  console.log('\n=== SUMMARY ===\n');
  
  PLATFORMS.forEach(platform => {
    const platformResults = results[platform];
    const successRate = (platformResults.queriesWithResults / platformResults.queriesTested) * 100;
    
    console.log(`${platform.toUpperCase()}:`);
    console.log(`- Total products found: ${platformResults.totalResults}`);
    console.log(`- Queries with results: ${platformResults.queriesWithResults}/${platformResults.queriesTested} (${successRate.toFixed(2)}%)`);
    
    if (successRate >= 80) {
      console.log(`- Status: ✅ EXCELLENT - ${platform} is working well with Serper.dev API`);
    } else if (successRate >= 50) {
      console.log(`- Status: ✓ GOOD - ${platform} is working with Serper.dev API but could be better`);
    } else if (successRate > 0) {
      console.log(`- Status: ⚠️ POOR - ${platform} is working with Serper.dev API but not reliably`);
    } else {
      console.log(`- Status: ❌ FAILED - ${platform} is not working with Serper.dev API`);
    }
    
    console.log('');
  });
  
  // Provide recommendation
  console.log('RECOMMENDATION:');
  const workingPlatforms = PLATFORMS.filter(platform => results[platform].queriesWithResults > 0);
  
  if (workingPlatforms.length === PLATFORMS.length) {
    console.log('All platforms are working with Serper.dev API. You can use all of them in ShopSavvy.');
  } else if (workingPlatforms.length > 0) {
    console.log(`Use these platforms in ShopSavvy: ${workingPlatforms.join(', ')}`);
    console.log(`Avoid these platforms: ${PLATFORMS.filter(p => !workingPlatforms.includes(p)).join(', ')}`);
  } else {
    console.log('No platforms are working reliably with Serper.dev API. Consider using a different approach.');
  }
}

// Run the test
testAllPlatforms().catch(error => {
  console.error('Error running test:', error);
});
