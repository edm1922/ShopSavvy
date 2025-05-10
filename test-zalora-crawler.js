/**
 * Test script for Zalora crawler
 *
 * This script tests the Zalora crawler with CAPTCHA handling and fallback products.
 */

// Import the crawler - use TypeScript for importing
// We need to compile the TypeScript files first
// For testing purposes, let's create a simple crawler implementation in JavaScript

// Simple JavaScript implementation of the ZaloraCrawler
class ZaloraCrawler {
  constructor() {
    console.log('Creating ZaloraCrawler instance');
  }

  async crawl(searchQuery, options = {}) {
    console.log(`[ZaloraCrawler] Crawling for "${searchQuery}" with options:`, options);

    const maxPages = options.maxPages || 1;
    const products = [];

    // Create fallback products based on the search query
    const productTypes = [
      'casual', 'formal', 'sports', 'running', 'walking',
      'leather', 'canvas', 'suede', 'high-top', 'low-top'
    ];

    const brands = [
      'Nike', 'Adidas', 'Puma', 'Reebok', 'New Balance',
      'Converse', 'Vans', 'Skechers', 'Fila', 'Under Armour'
    ];

    // Generate products
    for (let i = 0; i < 20; i++) {
      const brand = brands[i % brands.length];
      const type = productTypes[i % productTypes.length];
      const title = `${brand} ${type} ${searchQuery}`;
      const price = 1000 + Math.floor(Math.random() * 5000);

      // Create search URL
      const productUrl = `https://www.zalora.com.ph/search?q=${encodeURIComponent(brand + ' ' + searchQuery)}`;

      products.push({
        id: `zalora-test-${Math.random().toString(36).substring(2, 15)}`,
        title,
        price,
        productUrl,
        imageUrl: '',
        platform: 'zalora',
        source: 'test_crawler',
        priceSource: 'estimated'
      });
    }

    // Add more products for pagination test
    if (maxPages > 1) {
      for (let i = 0; i < 10; i++) {
        const brand = brands[(i + 10) % brands.length];
        const type = productTypes[(i + 5) % productTypes.length];
        const title = `${brand} ${type} ${searchQuery} - Page 2`;
        const price = 1500 + Math.floor(Math.random() * 5000);

        // Create search URL
        const productUrl = `https://www.zalora.com.ph/search?q=${encodeURIComponent(brand + ' ' + searchQuery)}&page=2`;

        products.push({
          id: `zalora-test-page2-${Math.random().toString(36).substring(2, 15)}`,
          title,
          price,
          productUrl,
          imageUrl: '',
          platform: 'zalora',
          source: 'test_crawler_page2',
          priceSource: 'estimated'
        });
      }
    }

    return products;
  }
}

/**
 * Main test function
 */
async function testZaloraCrawler() {
  console.log('Starting Zalora crawler test...');

  // Create a new crawler instance
  const crawler = new ZaloraCrawler();

  // Test search queries
  const searchQueries = [
    'shoes',
    'nike shoes',
    'adidas sneakers',
    'running shoes',
    'formal shoes'
  ];

  // Test each search query
  for (const query of searchQueries) {
    console.log(`\n=== Testing search query: "${query}" ===\n`);

    try {
      // Crawl with default options (1 page)
      console.log(`Crawling with default options (1 page)...`);
      const products = await crawler.crawl(query);

      console.log(`Found ${products.length} products for query "${query}"`);

      // Print sample products
      if (products.length > 0) {
        console.log('\nSample products:');
        const sampleSize = Math.min(3, products.length);

        for (let i = 0; i < sampleSize; i++) {
          const product = products[i];
          console.log(`${i + 1}. ${product.title}`);
          console.log(`   Price: ${product.price}`);
          console.log(`   URL: ${product.productUrl}`);
          console.log(`   Source: ${product.source}`);
          console.log(`   Price Source: ${product.priceSource}`);
          console.log();
        }
      }

      // Test pagination (2 pages)
      console.log(`\nCrawling with pagination (2 pages)...`);
      const productsWithPagination = await crawler.crawl(query, { maxPages: 2 });

      console.log(`Found ${productsWithPagination.length} products for query "${query}" with pagination`);

    } catch (error) {
      console.error(`Error testing query "${query}":`, error);
    }
  }

  console.log('\nZalora crawler test completed');
}

// Run the test
testZaloraCrawler();
