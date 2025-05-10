/**
 * Script to clean up scraper files
 *
 * This script removes all scraper-related files from the codebase.
 *
 * Usage: node scripts/cleanup-scrapers.js
 */

const fs = require('fs');
const path = require('path');

// Files and directories to remove
const filesToRemove = [
  // Scraper implementation files
  'src/services/scrapers/lazada-scraper.ts',
  'src/services/scrapers/zalora-scraper.ts',
  'src/services/scrapers/shein-scraper.ts',
  'src/services/scrapers/scraper-factory.ts',
  'src/services/scrapers/scraper-factory-server.ts',
  'src/services/scrapers/types.ts',
  'src/services/scrapers/__tests__/lazada-scraper.test.ts',
  'src/services/scrapers/__tests__/zalora-scraper.test.ts',
  'src/services/scrapers/__tests__/shein-scraper.test.ts',

  // Custom crawler files
  'src/services/custom-crawler/index.ts',
  'src/services/custom-crawler/deepseek-extractor.ts',
  'src/services/custom-crawler/deepseek-enhanced-extractor.ts',
  'src/services/custom-crawler/deepseek-v3-extractor.ts',
  'src/services/custom-crawler/html-processor.ts',
  'src/services/custom-crawler/zalora-direct-extractor.ts',
  'src/services/custom-crawler/zalora-improved-extractor.ts',
  'src/services/custom-crawler/proxy-manager.ts',
  'src/services/custom-crawler/captcha-solver.ts',
  'src/services/custom-crawler/fingerprint-randomizer.ts',
  'src/services/custom-crawler/session-manager.ts',
  'src/services/custom-crawler/README.md',

  // Test files
  'test-lazada-scraper.js',
  'test-lazada-scraper.ts',
  'test-lazada-scraper-direct.js',
  'test-lazada-scraper-simple.js',
  'test-zalora-scraper.js',
  'test-shein-scraper.js',
  'src/scripts/scraper-test/index.ts',
  'src/scripts/scraper-test/README.md',
  'src/scripts/test-zalora-extractor.ts',
  'src/tests/scrapers.test.ts',

  // API routes
  'src/app/api/test-scrapers/route.ts',
  'src/app/api/test-lazada/route.ts',
  'src/app/api/test-zalora/route.ts',
  'src/app/api/test-shein/route.ts',
  'src/app/api/test/lazada/route.ts',
  'src/app/api/test/zalora/route.ts',
  'src/app/api/test/shein/route.ts',
  'src/app/api/test-deepseek/route.ts',
  'src/app/api/test-deepseek-enhanced/route.ts',
  'src/app/api/test-deepseek-v3/route.ts',
  'src/app/api/zalora-scraper/route.ts',
  'src/app/api/test-shein-rapid/route.ts',
  'src/app/api/test-shein-rapid-implementation/route.ts',

  // Search service files
  'src/services/search/custom-universal-search.ts',
  'src/services/search/advanced-search-parser.ts',
];

// Directories to remove
const dirsToRemove = [
  'src/services/scrapers',
  'src/services/custom-crawler',
  'src/services/scrapers/__tests__',
  'src/app/test-scrapers',
  'src/app/test-images',
  'src/app/test-image-proxy',
  'src/app/test-lazada-images',
  'src/app/test-lazada-image-proxy',
  'src/app/test-zalora-images',
  'src/app/test-shein-images',
  'src/app/test-pagination',
  'src/app/(app)/test-deepseek-enhanced',
];

/**
 * Remove a file if it exists
 *
 * @param {string} filePath The path to the file
 */
function removeFile(filePath) {
  const fullPath = path.join(process.cwd(), filePath);

  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
      console.log(`Removed file: ${filePath}`);
    } catch (error) {
      console.error(`Error removing file ${filePath}:`, error.message);
    }
  } else {
    console.log(`File not found: ${filePath}`);
  }
}

/**
 * Remove a directory recursively if it exists
 *
 * @param {string} dirPath The path to the directory
 */
function removeDir(dirPath) {
  const fullPath = path.join(process.cwd(), dirPath);

  if (fs.existsSync(fullPath)) {
    try {
      // Recursively remove directory and all contents
      const removeRecursive = (path) => {
        if (fs.existsSync(path)) {
          fs.readdirSync(path).forEach((file) => {
            const curPath = `${path}/${file}`;
            if (fs.lstatSync(curPath).isDirectory()) {
              // Recursive call for directories
              removeRecursive(curPath);
            } else {
              // Delete file
              fs.unlinkSync(curPath);
            }
          });
          // Delete empty directory
          fs.rmdirSync(path);
        }
      };

      removeRecursive(fullPath);
      console.log(`Removed directory: ${dirPath}`);
    } catch (error) {
      console.error(`Error removing directory ${dirPath}:`, error.message);
    }
  } else {
    console.log(`Directory not found: ${dirPath}`);
  }
}

/**
 * Main function
 */
function main() {
  console.log('Cleaning up scraper files...');

  // Remove files
  filesToRemove.forEach(removeFile);

  // Remove directories (only if empty)
  dirsToRemove.forEach(removeDir);

  console.log('Cleanup completed!');
}

// Run the main function
main();
