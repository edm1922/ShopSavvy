/**
 * Serper.dev API service for product search
 *
 * This service provides functions to search for products using the Serper.dev API.
 * It includes caching to minimize API usage and improve performance.
 */

import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import { Product } from './types';

// Initialize Supabase client for caching
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://olazrafayxrpqyajufle.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sYXpyYWZheXhycHF5YWp1ZmxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY2OTE3NywiZXhwIjoyMDYyMjQ1MTc3fQ.uobIqILTZmxJ9SS_sLZ4Y0n8dW7Y6E4BEZMxm-8SCyk';
const supabase = createClient(supabaseUrl, supabaseKey);

// Serper.dev API configuration
const SERPER_API_URL = 'https://google.serper.dev/shopping';
const SERPER_API_KEY = process.env.SERPER_API_KEY || '3986a10df3a191c663afa1d08d3929d1a47fb875';

// Cache configuration
const CACHE_TABLE = 'search_cache';
const CACHE_EXPIRATION_DAYS = 7; // Cache results for 7 days by default
const CACHE_EXPIRATION_DAYS_NEWEST = 1; // Cache "newest" search results for only 1 day

/**
 * Generate query variations to simulate pagination and get more diverse results
 *
 * @param query The original search query
 * @param count Number of variations to generate
 * @param sortBy Optional sort order to influence query variations
 * @returns Array of query variations
 */
function generateQueryVariations(query: string, count: number, sortBy: string = ''): string[] {
  // Always include the original query
  const variations: string[] = [query];

  if (count <= 1) {
    return variations;
  }

  // Select modifiers based on the sort order
  let modifiers: string[] = [];

  if (sortBy === 'price_asc') {
    // Cheapest search type - focus on budget-friendly terms
    modifiers = [
      'cheap', 'affordable', 'budget', 'discount', 'sale', 'clearance',
      'low price', 'best price', 'cheapest', 'inexpensive', 'bargain',
      'deals', 'low cost', 'under 500', 'under 1000', 'value'
    ];
  } else if (sortBy === 'price_desc') {
    // Most expensive search type - focus on premium terms
    modifiers = [
      'premium', 'luxury', 'high-end', 'designer', 'exclusive', 'top quality',
      'professional', 'best', 'high quality', 'authentic', 'original',
      'genuine', 'official', 'branded', 'signature'
    ];
  } else if (sortBy === 'popularity_desc') {
    // Popular/trending search type - focus on trending terms
    modifiers = [
      'popular', 'trending', 'best selling', 'top rated', 'highly rated',
      'recommended', 'viral', 'hot', 'in demand', 'most wanted',
      'favorite', 'top choice', 'best seller', 'most popular'
    ];
  } else if (sortBy === 'date_desc') {
    // Newest items search type - focus on new arrival terms
    modifiers = [
      'new', 'latest', 'new arrival', 'just released', 'fresh', 'recent',
      'this season', '2024', 'new collection', 'just in', 'newly added',
      'updated', 'modern', 'current', 'latest model'
    ];
  } else {
    // Default search type - use a mix of all modifiers
    modifiers = [
      'best', 'top', 'cheap', 'affordable', 'quality', 'popular',
      'online', 'sale', 'discount', 'new', 'branded', 'authentic',
      'shop', 'buy', 'price', 'review', 'compare', 'deals on'
    ];
  }

  // Add location modifiers
  const locations = ['philippines', 'manila', 'ph', 'online'];

  // Generate variations by adding modifiers
  for (let i = 1; i < count && variations.length < count; i++) {
    // Try different combinations of modifiers
    const modifier = modifiers[i % modifiers.length];
    const location = locations[i % locations.length];

    // Create variations with different patterns
    if (i % 3 === 0) {
      variations.push(`${modifier} ${query} ${location}`);
    } else if (i % 3 === 1) {
      variations.push(`${query} ${modifier} in ${location}`);
    } else {
      variations.push(`${modifier} ${query}`);
    }
  }

  // Limit to the requested count
  return variations.slice(0, count);
}

/**
 * Remove duplicate products based on product URL and title+source combination
 *
 * @param products Array of products
 * @returns Array of unique products
 */
function removeDuplicates(products: any[]): any[] {
  const uniqueUrls = new Set();
  const uniqueTitleSourceCombos = new Set();

  return products.filter(product => {
    const url = product.link || '';

    // Check URL first (if it exists and is not empty)
    if (url && uniqueUrls.has(url)) {
      return false;
    }

    // Then check title+source combination (more reliable than just URL)
    const title = product.title || '';
    const source = product.source || '';

    if (title && source) {
      const titleSourceKey = `${title.toLowerCase().trim()}-${source.toLowerCase()}`;
      if (uniqueTitleSourceCombos.has(titleSourceKey)) {
        return false;
      }
      uniqueTitleSourceCombos.add(titleSourceKey);
    }

    // Add URL to set if it exists
    if (url) {
      uniqueUrls.add(url);
    }

    return true;
  });
}

/**
 * Search for products using Serper.dev API
 *
 * @param query The search query
 * @param options Search options
 * @returns Array of products
 */
export async function searchProducts(
  query: string,
  options: {
    country?: string;
    language?: string;
    maxResults?: number;
    useCache?: boolean;
    maxPages?: number; // Number of API calls to make
    sortBy?: string;   // Sort order for results
    forceRefreshAll?: boolean; // Force refresh all platforms
    platformsToSearch?: string[]; // Specific platforms to search for
  } = {}
): Promise<Product[]> {
  const {
    country = 'ph',
    language = 'en',
    maxResults = 200, // Increased from 50 to get more variety
    useCache = true,
    maxPages = 1, // Default to 1 page (1 API call)
    sortBy = '',   // Default no sorting
    forceRefreshAll = false, // Default to not forcing refresh for all platforms
    platformsToSearch: requestedPlatforms = [] // Default to empty array (will be filled later)
  } = options;

  console.log(`[SerperAPI] Searching for "${query}" with options:`, options);
  console.log(`[SerperAPI] Will make up to ${maxPages} API calls to simulate pagination`);

  // Check cache first if enabled
  let cachedData = null;
  let platformsToSearch = [];
  let cachedProducts = [];

  // Define the major platforms we support
  const majorPlatforms = ['lazada', 'zalora', 'shein', 'shopee'];

  // Check if specific platforms were requested
  if (requestedPlatforms.length > 0) {
    // Use the specified platforms
    platformsToSearch = [...requestedPlatforms];
    console.log(`[SerperAPI] Using specified platforms to search: ${platformsToSearch.join(', ')}`);

    // We'll still get the cached data to combine with fresh results later
    if (useCache) {
      cachedData = await getCachedResults(query, country, language);
      if (cachedData) {
        // We're only using the cached products for platforms we're not searching for
        cachedProducts = cachedData.products.filter(product =>
          !platformsToSearch.includes(product.platform.toLowerCase())
        );
        console.log(`[SerperAPI] Found ${cachedProducts.length} cached products for platforms we're not searching for`);
      }
    }
  }
  // If forceRefreshAll is true, we'll search for all platforms regardless of cache
  else if (forceRefreshAll) {
    platformsToSearch = [...majorPlatforms];
    console.log(`[SerperAPI] Force refresh all platforms requested, will search for: ${platformsToSearch.join(', ')}`);

    // We'll still get the cached data to combine with fresh results later
    if (useCache) {
      cachedData = await getCachedResults(query, country, language);
      if (cachedData) {
        // We're not using the cached products directly, but we'll keep track of them
        // to avoid duplicates when we update the cache
        cachedProducts = [];
        console.log(`[SerperAPI] Found cached data for "${query}" but ignoring due to forceRefreshAll`);
      }
    }
  } else if (useCache) {
    // Normal caching behavior - check cache and only search for missing platforms
    cachedData = await getCachedResults(query, country, language);
    if (cachedData) {
      console.log(`[SerperAPI] Using cached results for "${query}" from platforms: ${cachedData.cachedPlatforms.join(', ')}`);
      cachedProducts = cachedData.products;

      // If we have all major platforms cached, just return the cached results
      const allMajorPlatformsCached = majorPlatforms.every(platform =>
        cachedData.cachedPlatforms.includes(platform)
      );

      if (allMajorPlatformsCached) {
        console.log(`[SerperAPI] All major platforms are already cached for "${query}", returning cached results`);
        return cachedProducts;
      }

      // Determine which platforms we need to search for
      platformsToSearch = majorPlatforms.filter(platform =>
        !cachedData.cachedPlatforms.includes(platform)
      );

      console.log(`[SerperAPI] Need to search for additional platforms: ${platformsToSearch.join(', ')}`);
    } else {
      // No cache hit, search for all platforms
      platformsToSearch = [...majorPlatforms];
      console.log(`[SerperAPI] No cache hit, will search for all platforms: ${platformsToSearch.join(', ')}`);
    }
  } else {
    // Cache disabled, search for all platforms
    platformsToSearch = [...majorPlatforms];
    console.log(`[SerperAPI] Cache disabled, will search for all platforms: ${platformsToSearch.join(', ')}`);
  }

  // If no cache hit or cache disabled, call the API
  try {
    console.log(`[SerperAPI] Calling Serper.dev API for "${query}"`);

    // Make sure we have an API key
    if (!SERPER_API_KEY) {
      console.error('[SerperAPI] No API key provided');
      return [];
    }

    // Make multiple API calls with different query variations to simulate pagination
    // and get more diverse results
    const allResults: any[] = [];
    const variations = generateQueryVariations(query, maxPages, sortBy);

    console.log(`[SerperAPI] Generated ${variations.length} query variations to simulate pagination with sortBy=${sortBy}`);

    // Log which platforms we're searching for
    console.log(`[SerperAPI] Will search for platforms: ${platformsToSearch.join(', ')}`);

    // Make API calls in parallel for better performance
    const apiCalls = variations.map(async (variation, index) => {
      try {
        console.log(`[SerperAPI] Making API call ${index + 1}/${variations.length} with query: "${variation}"`);

        // Add platform-specific terms to the query
        let queryWithPlatforms = variation;

        // Get the platforms to include in the query
        const queryPlatforms = platformsToSearch.includes('all') ?
          ['lazada', 'zalora', 'shein', 'shopee'] :
          platformsToSearch;

        // Add platform terms to the query
        const platformTerms = queryPlatforms.map(platform => {
          // For each platform, add a specific term to target that platform
          if (platform.toLowerCase() === 'lazada') return 'lazada philippines';
          if (platform.toLowerCase() === 'zalora') return 'zalora philippines';
          if (platform.toLowerCase() === 'shein') return 'shein philippines';
          if (platform.toLowerCase() === 'shopee') return 'shopee philippines';
          return platform;
        });

        // Add platform terms to the query
        queryWithPlatforms = `${variation} (${platformTerms.join(' OR ')})`;
        console.log(`[SerperAPI] Modified query to target platforms: "${queryWithPlatforms}"`);

        const response = await axios.post(
          SERPER_API_URL,
          {
            q: queryWithPlatforms,
            gl: country,
            hl: language
          },
          {
            headers: {
              'X-API-KEY': SERPER_API_KEY,
              'Content-Type': 'application/json'
            }
          }
        );

        // Extract shopping results
        const shoppingResults = response.data.shopping || [];
        console.log(`[SerperAPI] API call ${index + 1} returned ${shoppingResults.length} results`);

        return shoppingResults;
      } catch (error) {
        console.error(`[SerperAPI] Error in API call ${index + 1}:`, error);
        return [];
      }
    });

    // Wait for all API calls to complete
    const resultsArrays = await Promise.all(apiCalls);

    // Combine all results
    resultsArrays.forEach(results => {
      allResults.push(...results);
    });

    // Remove duplicates based on product URL
    const uniqueResults = removeDuplicates(allResults);
    console.log(`[SerperAPI] Combined ${allResults.length} results, reduced to ${uniqueResults.length} unique results`);

    // Use the combined results for the rest of the function
    const response = { data: { shopping: uniqueResults } };

    // Extract shopping results
    const shoppingResults = response.data.shopping || [];
    console.log(`[SerperAPI] Found ${shoppingResults.length} total results`);

    // Log the first few results for debugging
    if (shoppingResults.length > 0) {
      console.log('[SerperAPI] Sample results:');
      shoppingResults.slice(0, 3).forEach((item: any, index: number) => {
        console.log(`[SerperAPI] Result ${index + 1}:`, {
          title: item.title,
          source: item.source,
          price: item.price
        });
      });
    }

    // Filter results to only include the platforms we're searching for
    let filteredResults = shoppingResults;

    // Only filter if we're searching for specific platforms
    if (platformsToSearch.length > 0 && !platformsToSearch.includes('all')) {
      // Convert platform names to lowercase for case-insensitive comparison
      const platformsLower = platformsToSearch.map(p => p.toLowerCase());

      filteredResults = shoppingResults.filter((item: any) => {
        const source = (item.source || '').toLowerCase();
        // Check if the source contains any of our target platforms
        return platformsLower.some(platform => source.includes(platform));
      });

      console.log(`[SerperAPI] Filtered from ${shoppingResults.length} to ${filteredResults.length} results from target platforms: ${platformsToSearch.join(', ')}`);
    } else {
      // If we're searching all platforms, still filter to only include our supported platforms
      const supportedPlatforms = ['lazada', 'zalora', 'shein', 'shopee'];

      filteredResults = shoppingResults.filter((item: any) => {
        const source = (item.source || '').toLowerCase();
        // Check if the source contains any of our supported platforms
        return supportedPlatforms.some(platform => source.includes(platform));
      });

      console.log(`[SerperAPI] Filtered from ${shoppingResults.length} to ${filteredResults.length} results from supported platforms`);
    }

    // Log all sources for debugging
    const allSources = new Set(shoppingResults.map((item: any) => item.source || 'Unknown'));
    console.log('[SerperAPI] All sources found:', Array.from(allSources));

    // Log sources we kept after filtering
    const keptSources = new Set(filteredResults.map((item: any) => item.source || 'Unknown'));
    console.log('[SerperAPI] Sources kept after filtering:', Array.from(keptSources));

    // Log the maxResults parameter
    console.log(`[SerperAPI] Using maxResults: ${maxResults} to limit results`);

    // Convert to our Product format
    const products = filteredResults
      .slice(0, maxResults)
      .map((item: any) => mapSerperResultToProduct(item));

    console.log(`[SerperAPI] Final product count after applying maxResults limit: ${products.length}`);

    // Handle different caching scenarios
    if (forceRefreshAll) {
      // When forcing refresh for all platforms, we replace the entire cache
      console.log(`[SerperAPI] Force refresh all platforms: got ${products.length} fresh results`);

      // Define minimum acceptable result count for caching
      const MIN_RESULTS_FOR_CACHING = 15; // Higher threshold for complete refresh

      // Cache the results only if we have enough to make it worthwhile
      if (products.length >= MIN_RESULTS_FOR_CACHING && useCache) {
        console.log(`[SerperAPI] Replacing entire cache with ${products.length} fresh results`);
        // Use a special flag to indicate we're replacing the entire cache
        await cacheResults(query, country, language, products, sortBy);
      } else if (products.length > 0 && products.length < MIN_RESULTS_FOR_CACHING && useCache) {
        console.log(`[SerperAPI] Not replacing cache because only ${products.length} items found (below threshold of ${MIN_RESULTS_FOR_CACHING})`);
      }

      return products;
    } else if (cachedProducts.length > 0) {
      // Normal case: combine cached products with new results for missing platforms
      console.log(`[SerperAPI] Combining ${products.length} new products with ${cachedProducts.length} cached products`);

      // Create maps to track existing products by URL and by title+platform combination
      const existingProductUrls = new Set();
      const existingTitlePlatformCombos = new Set();

      cachedProducts.forEach(product => {
        existingProductUrls.add(product.productUrl);
        // Also track title+platform combinations to catch duplicates with slightly different URLs
        if (product.title && product.platform) {
          const titlePlatformKey = `${product.title.toLowerCase().trim()}-${product.platform.toLowerCase()}`;
          existingTitlePlatformCombos.add(titlePlatformKey);
        }
      });

      // Filter out any new products that duplicate cached ones
      const uniqueNewProducts = products.filter(product => {
        // Check URL first
        if (existingProductUrls.has(product.productUrl)) {
          return false;
        }

        // Then check title+platform combination
        if (product.title && product.platform) {
          const titlePlatformKey = `${product.title.toLowerCase().trim()}-${product.platform.toLowerCase()}`;
          return !existingTitlePlatformCombos.has(titlePlatformKey);
        }

        return true;
      });

      console.log(`[SerperAPI] Found ${uniqueNewProducts.length} unique new products to add to cache`);

      // Combine cached and new products
      const combinedProducts = [...cachedProducts, ...uniqueNewProducts];

      // Cache the new products if we have enough
      if (uniqueNewProducts.length > 0 && useCache) {
        console.log(`[SerperAPI] Caching ${uniqueNewProducts.length} new products`);
        await cacheResults(query, country, language, uniqueNewProducts, sortBy);
      }

      return combinedProducts;
    } else {
      // No cached products, just cache and return the new ones
      // Define minimum acceptable result count for caching
      const MIN_RESULTS_FOR_CACHING = 5; // Lower threshold for individual platforms

      // Cache the results only if we have enough to make it worthwhile
      if (products.length >= MIN_RESULTS_FOR_CACHING && useCache) {
        console.log(`[SerperAPI] Caching ${products.length} results (meets minimum threshold of ${MIN_RESULTS_FOR_CACHING})`);
        await cacheResults(query, country, language, products, sortBy);
      } else if (products.length > 0 && products.length < MIN_RESULTS_FOR_CACHING && useCache) {
        console.log(`[SerperAPI] Not caching results because only ${products.length} items found (below threshold of ${MIN_RESULTS_FOR_CACHING})`);
      }

      return products;
    }
  } catch (error) {
    console.error('[SerperAPI] Error searching products:', error);
    return [];
  }
}

/**
 * Map a Serper.dev API result to our Product format
 *
 * @param item Serper.dev API result item
 * @returns Product object
 */
function mapSerperResultToProduct(item: any): Product {
  // Standardize platform names to our supported platforms
  let platform = 'Unknown';
  const sourceLower = (item.source || '').toLowerCase();

  // Map to our standard platform names
  if (sourceLower.includes('lazada')) {
    platform = 'Lazada';
  } else if (sourceLower.includes('zalora')) {
    platform = 'Zalora';
  } else if (sourceLower.includes('shein')) {
    platform = 'Shein';
  } else if (sourceLower.includes('shopee')) {
    platform = 'Shopee';
  } else {
    // For other platforms, just use the source with first letter capitalized
    platform = item.source ?
      item.source.charAt(0).toUpperCase() + item.source.slice(1).toLowerCase() :
      'Unknown';
  }

  // Create a more unique ID by combining multiple factors
  const uniqueId = item.productId ||
    `serper-${platform.toLowerCase()}-${item.title ? item.title.substring(0, 10).replace(/\s+/g, '-').toLowerCase() : ''}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;

  return {
    id: uniqueId,
    title: item.title || '',
    price: parsePrice(item.price),
    productUrl: item.link || '',
    imageUrl: item.imageUrl || '',
    platform: platform,
    rating: item.rating || 0,
    ratingCount: item.ratingCount || 0,
    source: 'serper'
  };
}

/**
 * Parse a price string to a number
 *
 * @param priceStr Price string (e.g., "₱1,234.56")
 * @returns Price as a number
 */
function parsePrice(priceStr: string): number {
  if (!priceStr) return 0;

  // Extract digits and decimal point
  const matches = priceStr.match(/[\d,.]+/);
  if (!matches) return 0;

  // Remove commas and convert to number
  return parseFloat(matches[0].replace(/,/g, ''));
}

/**
 * Get cached search results
 *
 * @param query Search query
 * @param country Country code
 * @param language Language code
 * @returns Object containing cached products and platforms info, or null if not found
 */
async function getCachedResults(
  query: string,
  country: string,
  language: string
): Promise<{ products: Product[], cachedPlatforms: string[] } | null> {
  try {
    // Calculate cache expiration date
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() - CACHE_EXPIRATION_DAYS);

    // Query the cache
    const { data, error } = await supabase
      .from(CACHE_TABLE)
      .select('*')
      .eq('search_query', query.toLowerCase())
      .gt('expires_at', expirationDate.toISOString())
      .single();

    if (error || !data) {
      console.log(`[SerperAPI] No cache found for query: "${query}"`);
      return null;
    }

    // Parse the results
    const products = typeof data.results === 'string' ? JSON.parse(data.results) : data.results;

    // Get the cached platforms
    const cachedPlatforms = data.platforms || [];

    // Check if we have any results
    if (!products || products.length === 0) {
      console.log(`[SerperAPI] Found cache entry for "${query}" but it contains no products`);
      return null;
    }

    // Group products by platform for logging
    const platformCounts = {};
    products.forEach(product => {
      const platform = product.platform.toLowerCase();
      platformCounts[platform] = (platformCounts[platform] || 0) + 1;
    });

    // Log what we found in the cache
    console.log(`[SerperAPI] Found cached results for "${query}" with ${products.length} products from platforms: ${Object.keys(platformCounts).join(', ')}`);
    Object.entries(platformCounts).forEach(([platform, count]) => {
      console.log(`[SerperAPI] - ${platform}: ${count} products`);
    });

    return { products, cachedPlatforms };
  } catch (error) {
    console.error('[SerperAPI] Error getting cached results:', error);
    return null;
  }
}

/**
 * Cache search results
 *
 * @param query Search query
 * @param country Country code
 * @param language Language code
 * @param products Products to cache
 * @param sortBy Optional sort order used for the search (affects cache expiration)
 */
async function cacheResults(
  query: string,
  country: string,
  language: string,
  products: Product[],
  sortBy: string = ''
): Promise<void> {
  try {
    // Determine if this is a "newest" search based on sortBy parameter or query patterns
    const isNewestSearch = sortBy === 'date_desc' ||
                          query.toLowerCase().includes('new') ||
                          query.toLowerCase().includes('latest') ||
                          query.toLowerCase().includes('recent');

    // Use shorter expiration for "newest" searches
    const expirationDays = isNewestSearch ? CACHE_EXPIRATION_DAYS_NEWEST : CACHE_EXPIRATION_DAYS;

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expirationDays);

    console.log(`[SerperAPI] Setting cache expiration to ${expirationDays} days ${isNewestSearch ? '(newest search)' : '(standard search)'}`);

    // Group products by platform
    const productsByPlatform = {};
    products.forEach(product => {
      const platform = product.platform.toLowerCase();
      if (!productsByPlatform[platform]) {
        productsByPlatform[platform] = [];
      }
      productsByPlatform[platform].push(product);
    });

    // Get platforms that have products
    const platforms = Object.keys(productsByPlatform);
    console.log(`[SerperAPI] Caching products for platforms: ${platforms.join(', ')}`);

    // Check if we already have a cache entry
    const { data } = await supabase
      .from(CACHE_TABLE)
      .select('id, results, platforms')
      .eq('search_query', query.toLowerCase())
      .single();

    if (data) {
      // We have an existing cache entry
      console.log(`[SerperAPI] Updating existing cache entry for "${query}"`);

      // Parse existing results
      const existingResults = typeof data.results === 'string'
        ? JSON.parse(data.results)
        : data.results || [];

      // Get existing platforms
      const existingPlatforms = data.platforms || [];

      // Create a map of existing products by ID to avoid duplicates
      const existingProductsMap = {};
      existingResults.forEach(product => {
        existingProductsMap[product.id] = product;
      });

      // Merge new products with existing ones, replacing products from the same platforms
      // and keeping products from platforms not in the new results
      const mergedResults = [...existingResults];

      // Remove existing products from platforms we're updating
      const filteredResults = mergedResults.filter(product => {
        const productPlatform = product.platform.toLowerCase();
        return !platforms.includes(productPlatform);
      });

      // Add all new products
      const updatedResults = [...filteredResults, ...products];

      // Update the cache entry
      await supabase
        .from(CACHE_TABLE)
        .update({
          results: JSON.stringify(updatedResults),
          created_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          platforms: [...new Set([...existingPlatforms, ...platforms])] // Combine platforms, remove duplicates
        })
        .eq('id', data.id);

      console.log(`[SerperAPI] Updated cache for "${query}" with ${products.length} new products, total now: ${updatedResults.length}`);
    } else {
      // Insert new cache entry
      await supabase
        .from(CACHE_TABLE)
        .insert({
          search_query: query.toLowerCase(),
          results: JSON.stringify(products),
          created_at: new Date().toISOString(),
          expires_at: expiresAt.toISOString(),
          platforms: platforms
        });

      console.log(`[SerperAPI] Created new cache entry for "${query}" with ${products.length} products`);
    }
  } catch (error) {
    console.error('[SerperAPI] Error caching results:', error);
  }
}
