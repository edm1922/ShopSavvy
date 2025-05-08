/**
 * Test script for the universal search service.
 * 
 * This script tests the universal search service with Serper.dev API.
 */

const fs = require('fs');
const path = require('path');

// Import the universal search service
// Note: We need to use require here since this is a CommonJS module
const { searchProducts } = require('../services/search/universal-search');

/**
 * Main function to test the universal search service.
 */
async function testUniversalSearch() {
  console.log('Starting universal search test...');
  
  try {
    // Search query
    const query = 'Arduino';
    
    // Search for products
    const products = await searchProducts(query, {}, {
      platformFilter: ['Shopee', 'Lazada'], // Only include Shopee and Lazada products
    });
    
    // Print the results
    console.log(`Found ${products.length} products`);
    console.log(JSON.stringify(products, null, 2));
    
    // Save the results to a file
    const resultsPath = path.join(process.cwd(), 'universal-search-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify(products, null, 2));
    console.log(`Saved results to: ${resultsPath}`);
    
    // Check if any Shopee products were found
    const shopeeProducts = products.filter(product => product.platform === 'Shopee');
    console.log(`Found ${shopeeProducts.length} Shopee products`);
    
    // Check if any Lazada products were found
    const lazadaProducts = products.filter(product => product.platform === 'Lazada');
    console.log(`Found ${lazadaProducts.length} Lazada products`);
    
    if (shopeeProducts.length > 0) {
      console.log('Shopee products found! Universal search is working for Shopee.');
    } else {
      console.log('No Shopee products found. Universal search might not be finding Shopee products.');
    }
    
    if (lazadaProducts.length > 0) {
      console.log('Lazada products found! Universal search is working for Lazada.');
    } else {
      console.log('No Lazada products found. Universal search might not be finding Lazada products.');
    }
  } catch (error) {
    console.error('Error testing universal search:', error);
  }
}

// Run the test
testUniversalSearch().catch(console.error);
