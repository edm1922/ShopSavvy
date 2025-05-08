/**
 * Script to run the scraper tests.
 *
 * Usage: npx ts-node scripts/test-scrapers.js
 */

// Set up environment for Next.js
process.env.NODE_ENV = 'development';

console.log('To run the tests, use:');
console.log('npx ts-node -r tsconfig-paths/register src/tests/scrapers.test.ts');
console.log('');
console.log('This will properly handle TypeScript imports and module paths.');
