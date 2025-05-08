/**
 * API route for testing the Lazada scraper.
 */

import { NextResponse } from 'next/server';
import { LazadaScraper } from '@/services/scrapers/lazada-scraper';
import { SearchFilters } from '@/services/shopping-apis';

/**
 * GET handler for testing the Lazada scraper.
 */
export async function GET() {
  try {
    console.log('Testing Lazada Scraper...');
    
    const scraper = new LazadaScraper();
    const results: any = {};
    
    // Test 1: Basic search
    console.log('\n1. Testing searchProducts...');
    try {
      const query = 'smartphone';
      console.log(`Searching for: ${query}`);
      
      const products = await scraper.searchProducts(query);
      
      results.basicSearch = {
        query,
        count: products.length,
        firstProduct: products.length > 0 ? products[0] : null,
      };
      
      console.log(`Found ${products.length} products`);
    } catch (error) {
      console.error('Error searching products:', error);
      results.basicSearch = { error: 'Failed to search products' };
    }
    
    // Test 2: Search with filters
    console.log('\n2. Testing searchProducts with filters...');
    try {
      const query = 'smartphone';
      const filters: SearchFilters = {
        minPrice: 5000,
        maxPrice: 20000,
        brand: 'Samsung'
      };
      
      console.log(`Searching for: ${query} with filters:`, filters);
      
      const products = await scraper.searchProducts(query, filters);
      
      results.filteredSearch = {
        query,
        filters,
        count: products.length,
        firstProduct: products.length > 0 ? products[0] : null,
      };
      
      console.log(`Found ${products.length} products`);
    } catch (error) {
      console.error('Error searching products with filters:', error);
      results.filteredSearch = { error: 'Failed to search products with filters' };
    }
    
    console.log('\nLazada Scraper test completed!');
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error testing Lazada scraper:', error);
    return NextResponse.json({ error: 'Failed to test Lazada scraper' }, { status: 500 });
  }
}
