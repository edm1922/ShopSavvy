// Test script to check different search queries with Serper.dev API
const axios = require('axios');
const fs = require('fs');

// Serper.dev API key
const SERPER_API_KEY = '3986a10df3a191c663afa1d08d3929d1a47fb875';

// Serper.dev API endpoint
const SERPER_API_ENDPOINT = 'https://google.serper.dev/shopping';

// Test different search queries
const searchQueries = [
  'Arduino',
  'Adidas',
  'iPhone',
  'Samsung',
  'Nike',
  'Laptop',
  'Headphones',
  'Camera',
  'Watch',
  'Shoes'
];

async function testSearchQueries() {
  console.log('Testing different search queries with Serper.dev API...');
  
  for (const query of searchQueries) {
    try {
      console.log(`\nSearching for: "${query}"`);
      
      // Make the API request
      const response = await axios.post(
        SERPER_API_ENDPOINT,
        {
          q: query,
          gl: 'ph', // Philippines
          hl: 'en', // English
        },
        {
          headers: {
            'X-API-KEY': SERPER_API_KEY,
            'Content-Type': 'application/json',
          },
        }
      );
      
      // Check if the response is valid
      if (!response.data || !response.data.shopping || !Array.isArray(response.data.shopping)) {
        console.error(`Invalid response for query "${query}":`, response.data);
        continue;
      }
      
      // Get the shopping results
      const results = response.data.shopping;
      
      console.log(`Found ${results.length} results for "${query}"`);
      
      // Count results by source
      const sourceCount = {};
      results.forEach(item => {
        const source = item.source.toLowerCase();
        sourceCount[source] = (sourceCount[source] || 0) + 1;
      });
      
      console.log('Results by source:');
      Object.entries(sourceCount).forEach(([source, count]) => {
        console.log(`- ${source}: ${count}`);
      });
      
      // Save the results to a file
      fs.writeFileSync(`serper-${query.toLowerCase()}.json`, JSON.stringify(response.data, null, 2));
      console.log(`Saved results to serper-${query.toLowerCase()}.json`);
      
    } catch (error) {
      console.error(`Error searching for "${query}":`, error.message);
      
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Response status:', error.response.status);
      }
    }
  }
}

// Run the test
testSearchQueries().catch(console.error);
