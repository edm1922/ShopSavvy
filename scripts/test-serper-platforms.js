/**
 * Test script to identify which Philippine e-commerce platforms are detectable by Serper.dev API
 * 
 * This script will run multiple searches for common products and collect all unique sources
 * to help identify which local platforms we should integrate with ShopSavvy.
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Serper.dev API configuration
const SERPER_API_URL = 'https://google.serper.dev/shopping';
const SERPER_API_KEY = process.env.SERPER_API_KEY || '3986a10df3a191c663afa1d08d3929d1a47fb875';

// Test queries - common products that should be available on most platforms
const TEST_QUERIES = [
  'shoes',
  'shirt',
  'dress',
  'watch',
  'bag',
  'phone',
  'laptop',
  'headphones',
  'makeup',
  'perfume'
];

// Country and language settings for Philippines
const COUNTRY = 'ph';
const LANGUAGE = 'en';

/**
 * Search for products using Serper.dev API
 * 
 * @param {string} query - The search query
 * @returns {Promise<Array>} - Array of shopping results
 */
async function searchProducts(query) {
  console.log(`Searching for "${query}"...`);
  
  try {
    const response = await axios.post(
      SERPER_API_URL,
      {
        q: `${query} philippines`,
        gl: COUNTRY,
        hl: LANGUAGE
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
    console.log(`Found ${shoppingResults.length} results for "${query}"`);
    
    return shoppingResults;
  } catch (error) {
    console.error(`Error searching for "${query}":`, error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return [];
  }
}

/**
 * Main function to run the platform detection test
 */
async function detectPlatforms() {
  console.log('Starting platform detection test...');
  
  // Store all results
  const allResults = [];
  
  // Store unique sources
  const sourcesMap = new Map();
  
  // Run searches for all test queries
  for (const query of TEST_QUERIES) {
    const results = await searchProducts(query);
    allResults.push(...results);
    
    // Add a delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`Total results collected: ${allResults.length}`);
  
  // Extract and count unique sources
  allResults.forEach(result => {
    const source = result.source || 'Unknown';
    if (!sourcesMap.has(source)) {
      sourcesMap.set(source, {
        count: 1,
        examples: [{ 
          query: result.title,
          price: result.price,
          link: result.link
        }]
      });
    } else {
      const sourceData = sourcesMap.get(source);
      sourceData.count++;
      if (sourceData.examples.length < 3) {
        sourceData.examples.push({ 
          query: result.title,
          price: result.price,
          link: result.link
        });
      }
    }
  });
  
  // Convert to array and sort by count
  const sourcesArray = Array.from(sourcesMap.entries()).map(([source, data]) => ({
    source,
    count: data.count,
    examples: data.examples
  }));
  
  // Sort by count (descending)
  sourcesArray.sort((a, b) => b.count - a.count);
  
  // Print results
  console.log('\nDetected platforms:');
  console.log('===================');
  
  sourcesArray.forEach((platform, index) => {
    console.log(`${index + 1}. ${platform.source} (${platform.count} products)`);
    console.log('   Example products:');
    platform.examples.forEach((example, i) => {
      console.log(`   ${i + 1}. ${example.query} - ${example.price}`);
      console.log(`      ${example.link}`);
    });
    console.log('');
  });
  
  // Save results to file
  const resultsPath = path.join(process.cwd(), 'serper-platforms-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify({
    totalResults: allResults.length,
    platforms: sourcesArray
  }, null, 2));
  
  console.log(`Results saved to: ${resultsPath}`);
  
  // Identify Philippine platforms
  const philippinePlatforms = sourcesArray.filter(platform => {
    const source = platform.source.toLowerCase();
    const isPhilippine = 
      source.includes('ph') || 
      source.includes('philippines') ||
      platform.examples.some(ex => {
        const link = ex.link.toLowerCase();
        return link.includes('.ph') || link.includes('philippines');
      });
    
    return isPhilippine;
  });
  
  console.log('\nPotential Philippine platforms:');
  console.log('=============================');
  
  philippinePlatforms.forEach((platform, index) => {
    console.log(`${index + 1}. ${platform.source} (${platform.count} products)`);
  });
}

// Run the platform detection
detectPlatforms().catch(error => {
  console.error('Error running platform detection:', error);
});
