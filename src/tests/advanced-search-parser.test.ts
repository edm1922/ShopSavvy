/**
 * Tests for the advanced search parser.
 */

import { parseNaturalLanguageQuery } from '@/services/search/advanced-search-parser';

/**
 * Tests the advanced search parser with various natural language queries.
 */
function testAdvancedSearchParser(): void {
  console.log('Testing advanced search parser...');
  
  // Test price filters
  testPriceFilters();
  
  // Test brand filters
  testBrandFilters();
  
  // Test rating filters
  testRatingFilters();
  
  // Test platform filters
  testPlatformFilters();
  
  // Test sort order
  testSortOrder();
  
  // Test complex queries
  testComplexQueries();
  
  console.log('All advanced search parser tests passed!');
}

/**
 * Tests price filters.
 */
function testPriceFilters(): void {
  console.log('Testing price filters...');
  
  // Test "under $X"
  const underResult = parseNaturalLanguageQuery('Find me a smartphone under $500');
  console.assert(underResult.query === 'smartphone', 'Query should be "smartphone"');
  console.assert(underResult.filters.maxPrice === 500, 'Max price should be 500');
  
  // Test "less than $X"
  const lessResult = parseNaturalLanguageQuery('Show me laptops less than $1000');
  console.assert(lessResult.query === 'laptops', 'Query should be "laptops"');
  console.assert(lessResult.filters.maxPrice === 1000, 'Max price should be 1000');
  
  // Test "over $X"
  const overResult = parseNaturalLanguageQuery('I want headphones over $100');
  console.assert(overResult.query === 'headphones', 'Query should be "headphones"');
  console.assert(overResult.filters.minPrice === 100, 'Min price should be 100');
  
  // Test "more than $X"
  const moreResult = parseNaturalLanguageQuery('Cameras more than $500');
  console.assert(moreResult.query === 'Cameras', 'Query should be "Cameras"');
  console.assert(moreResult.filters.minPrice === 500, 'Min price should be 500');
  
  // Test "between $X and $Y"
  const betweenResult = parseNaturalLanguageQuery('Find tablets between $200 and $600');
  console.assert(betweenResult.query === 'tablets', 'Query should be "tablets"');
  console.assert(betweenResult.filters.minPrice === 200, 'Min price should be 200');
  console.assert(betweenResult.filters.maxPrice === 600, 'Max price should be 600');
  
  // Test price range "$X-$Y"
  const rangeResult = parseNaturalLanguageQuery('Monitors $300-$800');
  console.assert(rangeResult.query === 'Monitors', 'Query should be "Monitors"');
  console.assert(rangeResult.filters.minPrice === 300, 'Min price should be 300');
  console.assert(rangeResult.filters.maxPrice === 800, 'Max price should be 800');
  
  // Test "cheap"
  const cheapResult = parseNaturalLanguageQuery('Cheap earbuds');
  console.assert(cheapResult.query === 'earbuds', 'Query should be "earbuds"');
  console.assert(cheapResult.filters.maxPrice === 300, 'Max price should be 300');
  
  // Test "expensive"
  const expensiveResult = parseNaturalLanguageQuery('Expensive watches');
  console.assert(expensiveResult.query === 'watches', 'Query should be "watches"');
  console.assert(expensiveResult.filters.minPrice === 800, 'Min price should be 800');
  
  console.log('Price filter tests passed!');
}

/**
 * Tests brand filters.
 */
function testBrandFilters(): void {
  console.log('Testing brand filters...');
  
  // Test brand extraction
  const samsungResult = parseNaturalLanguageQuery('Samsung phones');
  console.assert(samsungResult.query === 'phones', 'Query should be "phones"');
  console.assert(samsungResult.filters.brand === 'Samsung', 'Brand should be "Samsung"');
  
  const appleResult = parseNaturalLanguageQuery('Apple laptops under $2000');
  console.assert(appleResult.query === 'laptops', 'Query should be "laptops"');
  console.assert(appleResult.filters.brand === 'Apple', 'Brand should be "Apple"');
  console.assert(appleResult.filters.maxPrice === 2000, 'Max price should be 2000');
  
  console.log('Brand filter tests passed!');
}

/**
 * Tests rating filters.
 */
function testRatingFilters(): void {
  console.log('Testing rating filters...');
  
  // Test "X stars"
  const starsResult = parseNaturalLanguageQuery('4 stars headphones');
  console.assert(starsResult.query === 'headphones', 'Query should be "headphones"');
  console.assert(starsResult.filters.minRating === 4, 'Min rating should be 4');
  
  // Test "rated X or higher"
  const ratedResult = parseNaturalLanguageQuery('Cameras rated 4 or higher');
  console.assert(ratedResult.query === 'Cameras', 'Query should be "Cameras"');
  console.assert(ratedResult.filters.minRating === 4, 'Min rating should be 4');
  
  // Test "good reviews"
  const goodResult = parseNaturalLanguageQuery('Laptops with good reviews');
  console.assert(goodResult.query === 'Laptops', 'Query should be "Laptops"');
  console.assert(goodResult.filters.minRating === 4, 'Min rating should be 4');
  
  // Test "best"
  const bestResult = parseNaturalLanguageQuery('Best gaming mice');
  console.assert(bestResult.query === 'gaming mice', 'Query should be "gaming mice"');
  console.assert(bestResult.filters.minRating === 4.5, 'Min rating should be 4.5');
  
  console.log('Rating filter tests passed!');
}

/**
 * Tests platform filters.
 */
function testPlatformFilters(): void {
  console.log('Testing platform filters...');
  
  // Test Shopee
  const shopeeResult = parseNaturalLanguageQuery('Find smartphones on Shopee');
  console.assert(shopeeResult.query === 'smartphones', 'Query should be "smartphones"');
  console.assert(shopeeResult.platforms?.includes('Shopee'), 'Platforms should include "Shopee"');
  
  // Test Lazada
  const lazadaResult = parseNaturalLanguageQuery('Laptops from Lazada');
  console.assert(lazadaResult.query === 'Laptops', 'Query should be "Laptops"');
  console.assert(lazadaResult.platforms?.includes('Lazada'), 'Platforms should include "Lazada"');
  
  // Test both platforms
  const bothResult = parseNaturalLanguageQuery('Compare headphones on Shopee and Lazada');
  console.assert(bothResult.query === 'Compare headphones', 'Query should be "Compare headphones"');
  console.assert(bothResult.platforms?.includes('Shopee'), 'Platforms should include "Shopee"');
  console.assert(bothResult.platforms?.includes('Lazada'), 'Platforms should include "Lazada"');
  
  console.log('Platform filter tests passed!');
}

/**
 * Tests sort order.
 */
function testSortOrder(): void {
  console.log('Testing sort order...');
  
  // Test price ascending
  const cheapestResult = parseNaturalLanguageQuery('Cheapest smartphones');
  console.assert(cheapestResult.query === 'smartphones', 'Query should be "smartphones"');
  console.assert(cheapestResult.sortBy === 'price_asc', 'Sort by should be "price_asc"');
  
  // Test price descending
  const expensiveResult = parseNaturalLanguageQuery('Most expensive laptops');
  console.assert(expensiveResult.query === 'laptops', 'Query should be "laptops"');
  console.assert(expensiveResult.sortBy === 'price_desc', 'Sort by should be "price_desc"');
  
  // Test rating
  const ratingResult = parseNaturalLanguageQuery('Best rated headphones');
  console.assert(ratingResult.query === 'headphones', 'Query should be "headphones"');
  console.assert(ratingResult.sortBy === 'rating_desc', 'Sort by should be "rating_desc"');
  
  // Test popularity
  const popularResult = parseNaturalLanguageQuery('Most popular gaming mice');
  console.assert(popularResult.query === 'gaming mice', 'Query should be "gaming mice"');
  console.assert(popularResult.sortBy === 'popularity_desc', 'Sort by should be "popularity_desc"');
  
  console.log('Sort order tests passed!');
}

/**
 * Tests complex queries.
 */
function testComplexQueries(): void {
  console.log('Testing complex queries...');
  
  // Test complex query 1
  const complex1 = parseNaturalLanguageQuery('Find me the cheapest Samsung phones with at least 4 stars under $500');
  console.assert(complex1.query === 'phones', 'Query should be "phones"');
  console.assert(complex1.filters.brand === 'Samsung', 'Brand should be "Samsung"');
  console.assert(complex1.filters.minRating === 4, 'Min rating should be 4');
  console.assert(complex1.filters.maxPrice === 500, 'Max price should be 500');
  console.assert(complex1.sortBy === 'price_asc', 'Sort by should be "price_asc"');
  
  // Test complex query 2
  const complex2 = parseNaturalLanguageQuery('Best rated Apple laptops between $1000 and $2000 on Lazada');
  console.assert(complex2.query === 'laptops', 'Query should be "laptops"');
  console.assert(complex2.filters.brand === 'Apple', 'Brand should be "Apple"');
  console.assert(complex2.filters.minPrice === 1000, 'Min price should be 1000');
  console.assert(complex2.filters.maxPrice === 2000, 'Max price should be 2000');
  console.assert(complex2.sortBy === 'rating_desc', 'Sort by should be "rating_desc"');
  console.assert(complex2.platforms?.includes('Lazada'), 'Platforms should include "Lazada"');
  
  console.log('Complex query tests passed!');
}

// Run the tests
testAdvancedSearchParser();
