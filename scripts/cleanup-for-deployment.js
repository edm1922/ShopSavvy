/**
 * Script to clean up test files and debugging tools for deployment
 * 
 * This script identifies and lists files that should be removed before deployment
 * but doesn't actually delete them to preserve local development capabilities.
 * 
 * Usage: node scripts/cleanup-for-deployment.js
 */

const fs = require('fs');
const path = require('path');

// Files to be removed for deployment
const filesToRemove = [
  // Test scripts
  'test-lazada.js',
  'test-lazada-image-filtering.js',
  'test-zalora.js',
  'test-zalora-simple.js',
  'test-zalora-comprehensive.bat',
  'test-zalora.bat',
  'test-shein-only.js',
  'test-all-platforms.js',
  'test-serper-platforms.js',
  'test-cache.js',
  'test-specific-credentials.js',
  
  // Test API routes
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
  'src/app/api/test-custom-crawler/route.ts',
  
  // Test pages
  'src/app/test-supabase/page.tsx',
  'src/app/test-auth/page.tsx',
  'src/app/test-image-validation/page.tsx',
  'src/app/test-scrapers/page.tsx',
  'src/app/test-images/page.tsx',
  'src/app/test-image-proxy/page.tsx',
  'src/app/test-lazada-images/page.tsx',
  'src/app/test-lazada-image-proxy/page.tsx',
  'src/app/test-zalora-images/page.tsx',
  'src/app/test-shein-images/page.tsx',
  'src/app/test-pagination/page.tsx',
  'src/app/(app)/test-deepseek-enhanced/page.tsx',
  'src/app/debug-env/page.tsx',
];

// Directories to be removed for deployment
const dirsToRemove = [
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

// Function to check if a file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (err) {
    return false;
  }
}

// Function to check if a directory exists
function dirExists(dirPath) {
  try {
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  } catch (err) {
    return false;
  }
}

// Main function
function main() {
  console.log('=== Files to remove for deployment ===\n');
  
  // Check files
  const existingFiles = filesToRemove.filter(file => fileExists(file));
  
  if (existingFiles.length > 0) {
    console.log('Files:');
    existingFiles.forEach(file => {
      console.log(`- ${file}`);
    });
  } else {
    console.log('No test files found.');
  }
  
  console.log('\n');
  
  // Check directories
  const existingDirs = dirsToRemove.filter(dir => dirExists(dir));
  
  if (existingDirs.length > 0) {
    console.log('Directories:');
    existingDirs.forEach(dir => {
      console.log(`- ${dir}`);
    });
  } else {
    console.log('No test directories found.');
  }
  
  console.log('\n=== Instructions ===');
  console.log('These files and directories should be excluded from your Vercel deployment.');
  console.log('You can use .vercelignore to exclude them or remove them before deploying.');
  console.log('For local development, keep these files as they may be needed for testing.');
}

// Run the main function
main();
