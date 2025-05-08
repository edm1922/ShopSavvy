/**
 * Test script for Serper.dev API
 * 
 * This script tests the Serper.dev API for product search functionality.
 * It can be used to verify API functionality and test different search queries.
 * 
 * Usage:
 * node scripts/test-serper-api.js [query]
 * 
 * Example:
 * node scripts/test-serper-api.js "iPhone 15"
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Serper.dev API endpoint
const SERPER_API_ENDPOINT = 'https://google.serper.dev/shopping';

// Serper.dev API key
const SERPER_API_KEY = '3986a10df3a191c663afa1d08d3929d1a47fb875';

// Default search query if none provided
const DEFAULT_QUERY = 'iPhone 15';

// Get search query from command line arguments or use default
const searchQuery = process.argv[2] || DEFAULT_QUERY;

async function testSerperAPI() {
  console.log(`Testing Serper.dev API with query: "${searchQuery}"`);
  
  try {
    // Make the API request
    const response = await axios.post(
      SERPER_API_ENDPOINT,
      {
        q: searchQuery,
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
      console.error('Invalid response from Serper.dev API');
      return;
    }
    
    // Get the shopping results
    const products = response.data.shopping;
    
    console.log(`\nFound ${products.length} products:`);
    
    // Display product information
    products.forEach((product, index) => {
      console.log(`\n[${index + 1}] ${product.title}`);
      console.log(`   Price: ${product.price || 'N/A'}`);
      console.log(`   Source: ${product.source || 'N/A'}`);
      console.log(`   Link: ${product.link || 'N/A'}`);
      
      if (product.rating) {
        console.log(`   Rating: ${product.rating.rating || 'N/A'} (${product.rating.reviews_count || 0} reviews)`);
      }
    });
    
    // Save the raw response to a file
    const outputDir = path.join(__dirname, 'output');
    
    // Create output directory if it doesn't exist
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const outputFile = path.join(outputDir, `serper-${searchQuery.toLowerCase().replace(/\s+/g, '-')}.json`);
    fs.writeFileSync(outputFile, JSON.stringify(response.data, null, 2));
    
    console.log(`\nRaw response saved to: ${outputFile}`);
    
    // Analyze the response
    analyzeResponse(response.data);
    
  } catch (error) {
    console.error('Error testing Serper.dev API:', error.message);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

function analyzeResponse(data) {
  console.log('\n===== API Response Analysis =====');
  
  // Check for shopping results
  const products = data.shopping || [];
  console.log(`Shopping Results: ${products.length}`);
  
  // Check for local results
  const localResults = data.local || [];
  console.log(`Local Results: ${localResults.length}`);
  
  // Check for knowledge graph
  const hasKnowledgeGraph = data.knowledgeGraph ? 'Yes' : 'No';
  console.log(`Knowledge Graph: ${hasKnowledgeGraph}`);
  
  // Check for search information
  if (data.searchParameters) {
    console.log('Search Parameters:');
    console.log(`- Query: ${data.searchParameters.q || 'N/A'}`);
    console.log(`- Location: ${data.searchParameters.gl || 'N/A'}`);
    console.log(`- Language: ${data.searchParameters.hl || 'N/A'}`);
  }
  
  // Analyze product sources
  if (products.length > 0) {
    const sources = {};
    
    products.forEach(product => {
      const source = product.source || 'Unknown';
      sources[source] = (sources[source] || 0) + 1;
    });
    
    console.log('\nProduct Sources:');
    Object.entries(sources)
      .sort((a, b) => b[1] - a[1])
      .forEach(([source, count]) => {
        console.log(`- ${source}: ${count} products`);
      });
  }
  
  // Check for price range
  if (products.length > 0) {
    const prices = products
      .map(product => {
        if (!product.price) return null;
        
        // Extract numeric value from price string
        const match = product.price.match(/[\d,]+(\.\d+)?/);
        return match ? parseFloat(match[0].replace(/,/g, '')) : null;
      })
      .filter(price => price !== null);
    
    if (prices.length > 0) {
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      
      console.log('\nPrice Analysis:');
      console.log(`- Minimum Price: ₱${minPrice.toFixed(2)}`);
      console.log(`- Maximum Price: ₱${maxPrice.toFixed(2)}`);
      console.log(`- Average Price: ₱${avgPrice.toFixed(2)}`);
    }
  }
}

// Run the test
testSerperAPI().catch(console.error);
