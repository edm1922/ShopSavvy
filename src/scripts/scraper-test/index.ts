/**
 * Script to test the custom scrapers.
 */

// Load environment variables
import '../load-env';

import * as fs from 'fs';
import * as path from 'path';
import { getScraperForPlatform } from '../../services/scrapers/scraper-factory-server';

/**
 * Tests the custom scrapers with various queries.
 */
async function runTest() {
  const testQueries = [
    'iphone 13',
    'samsung tv',
    'nike shoes',
    'gaming laptop'
  ];

  const platforms = ['shopee', 'lazada'];

  // Create results directory if it doesn't exist
  const resultsDir = path.join(__dirname, 'results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  // Test each query on each platform
  for (const query of testQueries) {
    console.log(`\n=== Testing query: ${query} ===\n`);

    for (const platform of platforms) {
      try {
        console.log(`Testing ${platform} for query: ${query}`);

        // Get the scraper for the platform
        const scraper = getScraperForPlatform(platform);

        // Search for products
        const startTime = Date.now();
        const results = await scraper.searchProducts(query);
        const endTime = Date.now();

        // Create test result object
        const testResult = {
          query,
          platform,
          resultCount: results.length,
          executionTimeMs: endTime - startTime,
          timestamp: new Date().toISOString(),
          results: results
        };

        // Save results to file
        const filePath = path.join(resultsDir, `${platform}-${query.replace(/\s+/g, '-')}.json`);
        fs.writeFileSync(filePath, JSON.stringify(testResult, null, 2));

        console.log(`${platform}: Found ${results.length} results in ${endTime - startTime}ms`);
      } catch (error) {
        console.error(`Error testing ${platform} for query "${query}":`, error);
      }
    }
  }
}

// Run the test
runTest().catch(console.error);
