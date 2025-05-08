// Simple test script for Serper.dev API
const axios = require('axios');
const fs = require('fs');

// Serper.dev API key
const SERPER_API_KEY = '3986a10df3a191c663afa1d08d3929d1a47fb875';

// Serper.dev API endpoint
const SERPER_API_ENDPOINT = 'https://google.serper.dev/shopping';

async function testSerperAPI() {
  try {
    console.log('Testing Serper.dev API...');
    
    // Search query
    const query = 'Arduino';
    
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
    
    // Save the raw response for inspection
    fs.writeFileSync('serper-raw-response.json', JSON.stringify(response.data, null, 2));
    console.log('Saved raw response to serper-raw-response.json');
    
    // Check if the response is valid
    if (!response.data || !response.data.shopping || !Array.isArray(response.data.shopping)) {
      console.error('Invalid response:', response.data);
      return;
    }
    
    // Extract and process the shopping results
    const products = response.data.shopping.map(item => ({
      title: item.title,
      price: item.price,
      source: item.source,
      link: item.link,
      imageUrl: item.imageUrl,
      rating: item.rating,
    }));
    
    // Save the processed results
    fs.writeFileSync('serper-products.json', JSON.stringify(products, null, 2));
    console.log(`Saved ${products.length} products to serper-products.json`);
    
    // Count products by source
    const sourceCount = {};
    products.forEach(product => {
      const source = product.source.toLowerCase();
      sourceCount[source] = (sourceCount[source] || 0) + 1;
    });
    
    console.log('Products by source:');
    Object.entries(sourceCount).forEach(([source, count]) => {
      console.log(`- ${source}: ${count}`);
    });
    
    // Check for Shopee and Lazada products
    const shopeeProducts = products.filter(p => 
      p.source.toLowerCase().includes('shopee') || 
      p.link.toLowerCase().includes('shopee')
    );
    
    const lazadaProducts = products.filter(p => 
      p.source.toLowerCase().includes('lazada') || 
      p.link.toLowerCase().includes('lazada')
    );
    
    console.log(`Found ${shopeeProducts.length} Shopee products`);
    console.log(`Found ${lazadaProducts.length} Lazada products`);
    
  } catch (error) {
    console.error('Error testing Serper.dev API:', error);
    
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

// Run the test
testSerperAPI().catch(console.error);
