/**
 * Test script to verify Supabase caching for search results
 *
 * This script:
 * 1. Makes a search request
 * 2. Checks if the results are cached in Supabase
 * 3. Makes the same search request again to verify it uses the cached results
 */

// Import required modules
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://olazrafayxrpqyajufle.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sYXpyYWZheXhycHF5YWp1ZmxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY2OTE3NywiZXhwIjoyMDYyMjQ1MTc3fQ.uobIqILTZmxJ9SS_sLZ4Y0n8dW7Y6E4BEZMxm-8SCyk';
const supabase = createClient(supabaseUrl, supabaseKey);

// Cache configuration
const CACHE_TABLE = 'search_cache';

// Test search query
const testQuery = 'test_jacket_' + Date.now(); // Add timestamp to make it unique

// Function to check if a query is cached in Supabase
async function checkCache(query) {
  try {
    console.log(`Checking cache for query: "${query}"`);

    const { data, error } = await supabase
      .from(CACHE_TABLE)
      .select('*')
      .eq('search_query', query.toLowerCase())
      .single();

    if (error) {
      console.log(`No cache found for query: "${query}"`);
      return null;
    }

    console.log(`Cache found for query: "${query}"`);
    console.log(`Cache created at: ${data.created_at}`);
    console.log(`Cache expires at: ${data.expires_at}`);
    console.log(`Number of cached results: ${JSON.parse(data.results).length}`);

    return data;
  } catch (error) {
    console.error('Error checking cache:', error);
    return null;
  }
}

// Serper API configuration
const SERPER_API_URL = 'https://google.serper.dev/shopping';
const SERPER_API_KEY = '3986a10df3a191c663afa1d08d3929d1a47fb875';

// Function to directly search using Serper API and handle caching
async function makeSearchRequest(query, useCache = true) {
  try {
    console.log(`Making search request for query: "${query}" (useCache: ${useCache})`);

    // Check cache first if enabled
    if (useCache) {
      const cacheStartTime = Date.now();
      const cachedData = await checkCache(query);
      if (cachedData) {
        console.log(`Using cached results for query: "${query}"`);
        const results = JSON.parse(cachedData.results);
        const cacheEndTime = Date.now();
        console.log(`Retrieved ${results.length} results from cache in ${cacheEndTime - cacheStartTime}ms`);

        // Add request time to results for performance comparison
        results.requestTime = cacheEndTime - cacheStartTime;

        return results;
      }
    }

    // If no cache hit or cache disabled, call the API
    console.log(`Calling Serper API for query: "${query}"`);
    const startTime = Date.now();

    const response = await axios.post(
      SERPER_API_URL,
      {
        q: query,
        gl: 'ph',
        hl: 'en'
      },
      {
        headers: {
          'X-API-KEY': SERPER_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    const endTime = Date.now();
    console.log(`API request completed in ${endTime - startTime}ms`);

    // Extract shopping results
    const results = response.data.shopping || [];
    console.log(`Retrieved ${results.length} results from API`);

    // Cache the results if we found any and caching is enabled
    if (results.length > 0 && useCache) {
      await cacheResults(query, results);
    }

    // Add request time to results for performance comparison
    results.requestTime = endTime - startTime;

    return results;
  } catch (error) {
    console.error('Error making search request:', error);
    return [];
  }
}

// Function to cache search results
async function cacheResults(query, results) {
  try {
    console.log(`Caching ${results.length} results for query: "${query}"`);

    // Calculate expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Check if we already have a cache entry
    const { data } = await supabase
      .from(CACHE_TABLE)
      .select('id')
      .eq('search_query', query.toLowerCase())
      .single();

    if (data) {
      // Update existing cache entry
      await supabase
        .from(CACHE_TABLE)
        .update({
          results: JSON.stringify(results),
          created_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          platforms: ['lazada', 'zalora', 'shein']
        })
        .eq('id', data.id);

      console.log(`Updated existing cache entry for query: "${query}"`);
    } else {
      // Insert new cache entry
      await supabase
        .from(CACHE_TABLE)
        .insert({
          search_query: query.toLowerCase(),
          results: JSON.stringify(results),
          created_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          platforms: ['lazada', 'zalora', 'shein']
        });

      console.log(`Created new cache entry for query: "${query}"`);
    }
  } catch (error) {
    console.error('Error caching results:', error);
  }
}

// Main test function
async function runTest() {
  console.log('=== TESTING SUPABASE CACHING ===');

  // Step 1: Check if the test query is already cached (it shouldn't be)
  console.log('\n=== STEP 1: Check if test query is already cached ===');
  const initialCache = await checkCache(testQuery);

  // Step 2: Make a search request with caching enabled
  console.log('\n=== STEP 2: Make first search request (should cache results) ===');
  const firstResults = await makeSearchRequest(testQuery, true);

  // Step 3: Check if the results are now cached
  console.log('\n=== STEP 3: Check if results are now cached ===');
  const cacheAfterFirstRequest = await checkCache(testQuery);

  // Step 4: Make the same search request again (should use cache)
  console.log('\n=== STEP 4: Make second search request (should use cache) ===');
  const secondResults = await makeSearchRequest(testQuery, true);

  // Step 5: Make a search request with caching disabled (should bypass cache)
  console.log('\n=== STEP 5: Make search request with caching disabled ===');
  const noCacheResults = await makeSearchRequest(testQuery, false);

  // Summary
  console.log('\n=== TEST SUMMARY ===');
  console.log(`Initial cache check: ${initialCache ? 'FOUND (unexpected)' : 'NOT FOUND (expected)'}`);
  console.log(`Cache after first request: ${cacheAfterFirstRequest ? 'FOUND (expected)' : 'NOT FOUND (unexpected)'}`);
  console.log(`First request results count: ${firstResults.length}`);
  console.log(`Second request results count: ${secondResults.length}`);
  console.log(`No-cache request results count: ${noCacheResults.length}`);

  // Calculate response time improvements
  const firstRequestTime = firstResults.requestTime || 0;
  const secondRequestTime = secondResults.requestTime || 0;
  const timeSaved = firstRequestTime > 0 && secondRequestTime > 0
    ? Math.round((1 - secondRequestTime / firstRequestTime) * 100)
    : 0;

  if (firstRequestTime > 0 && secondRequestTime > 0) {
    console.log(`\nPerformance improvement:`);
    console.log(`First request time: ${firstRequestTime}ms`);
    console.log(`Second request time (cached): ${secondRequestTime}ms`);
    console.log(`Time saved: ${timeSaved}% faster with cache`);
  }

  // Determine if the test passed
  const testPassed =
    !initialCache &&
    cacheAfterFirstRequest &&
    firstResults.length > 0 &&
    secondResults.length > 0;

  console.log(`\nTEST ${testPassed ? 'PASSED ✅' : 'FAILED ❌'}`);
}

// Run the test
runTest().catch(error => {
  console.error('Test failed with error:', error);
});
