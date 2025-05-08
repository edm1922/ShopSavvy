/**
 * Script to compare Serper.dev API and custom scrapers.
 */

// Load environment variables
import '../load-env';

import * as fs from 'fs';
import * as path from 'path';
import * as SerperSearch from '../../services/search/universal-search';
import * as CustomSearch from '../../services/search/custom-universal-search';

/**
 * Compares the results from Serper.dev API and custom scrapers.
 */
async function compareResults() {
  const testQueries = [
    'iphone 13',
    'samsung tv',
    'nike shoes',
    'gaming laptop'
  ];

  // Create results directory if it doesn't exist
  const resultsDir = path.join(__dirname, 'results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }

  for (const query of testQueries) {
    console.log(`\n=== Comparing results for query: ${query} ===\n`);

    try {
      // Get results from custom scraper
      console.log(`Getting results from custom scraper for query: ${query}`);
      const customStartTime = Date.now();
      const customResults = await CustomSearch.searchProducts(query, undefined, ['shopee', 'lazada']);
      const customEndTime = Date.now();

      // Get results from Serper.dev
      console.log(`Getting results from Serper.dev for query: ${query}`);
      const serperStartTime = Date.now();
      const serperResults = await SerperSearch.searchProducts(query, undefined, {
        platformFilter: ['shopee', 'lazada']
      });
      const serperEndTime = Date.now();

      // Compare results
      const comparison = {
        query,
        timestamp: new Date().toISOString(),
        customScraper: {
          resultCount: customResults.length,
          executionTimeMs: customEndTime - customStartTime,
          resultsByPlatform: {
            shopee: customResults.filter(p => p.platform.toLowerCase() === 'shopee').length,
            lazada: customResults.filter(p => p.platform.toLowerCase() === 'lazada').length
          },
          firstFiveResults: customResults.slice(0, 5)
        },
        serperApi: {
          resultCount: serperResults.length,
          executionTimeMs: serperEndTime - serperStartTime,
          resultsByPlatform: {
            shopee: serperResults.filter(p => p.platform.toLowerCase() === 'shopee').length,
            lazada: serperResults.filter(p => p.platform.toLowerCase() === 'lazada').length
          },
          firstFiveResults: serperResults.slice(0, 5)
        },
        analysis: {
          timeDifference: (customEndTime - customStartTime) - (serperEndTime - serperStartTime),
          timeDifferencePercent: ((customEndTime - customStartTime) / (serperEndTime - serperStartTime) * 100) - 100,
          resultCountDifference: customResults.length - serperResults.length,
          resultCountDifferencePercent: customResults.length > 0 && serperResults.length > 0
            ? ((customResults.length / serperResults.length) * 100) - 100
            : 0
        }
      };

      // Save comparison to file
      const filePath = path.join(resultsDir, `comparison-${query.replace(/\s+/g, '-')}.json`);
      fs.writeFileSync(filePath, JSON.stringify(comparison, null, 2));

      console.log(`Comparison saved to ${filePath}`);
      console.log(`\nSummary for "${query}":`);
      console.log(`- Custom Scraper: ${customResults.length} results in ${customEndTime - customStartTime}ms`);
      console.log(`- Serper API: ${serperResults.length} results in ${serperEndTime - serperStartTime}ms`);
      console.log(`- Time difference: ${comparison.analysis.timeDifferencePercent.toFixed(2)}%`);
      console.log(`- Result count difference: ${comparison.analysis.resultCountDifferencePercent.toFixed(2)}%`);
    } catch (error) {
      console.error(`Error comparing results for "${query}":`, error);
    }
  }
}

// Run the comparison
compareResults().catch(console.error);
