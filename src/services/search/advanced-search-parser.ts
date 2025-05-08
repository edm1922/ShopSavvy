/**
 * Advanced search parser for natural language queries.
 * 
 * This module parses natural language search queries and extracts structured search parameters.
 * 
 * Examples:
 * - "Find me a smartphone under $500" -> { query: "smartphone", filters: { maxPrice: 500 } }
 * - "Show Samsung phones with good reviews" -> { query: "Samsung phones", filters: { brand: "Samsung", minRating: 4 } }
 * - "Cheap laptops with at least 8GB RAM" -> { query: "laptops 8GB RAM", filters: { maxPrice: 300 } }
 */

import { SearchFilters } from '../shopping-apis';

/**
 * Result of parsing a natural language search query.
 */
export interface ParsedSearchQuery {
  /**
   * The extracted search query.
   */
  query: string;
  
  /**
   * The extracted search filters.
   */
  filters: SearchFilters;
  
  /**
   * The platforms to search on.
   */
  platforms?: string[];
  
  /**
   * The sort order for the results.
   */
  sortBy?: string;
  
  /**
   * The number of results to return.
   */
  limit?: number;
}

/**
 * Parses a natural language search query.
 * 
 * @param input The natural language search query.
 * @returns The parsed search query.
 */
export function parseNaturalLanguageQuery(input: string): ParsedSearchQuery {
  // Initialize the result
  const result: ParsedSearchQuery = {
    query: input,
    filters: {},
  };
  
  // Convert to lowercase for easier matching
  const lowerInput = input.toLowerCase();
  
  // Extract price filters
  extractPriceFilters(lowerInput, result);
  
  // Extract brand filters
  extractBrandFilters(lowerInput, result);
  
  // Extract rating filters
  extractRatingFilters(lowerInput, result);
  
  // Extract platform filters
  extractPlatformFilters(lowerInput, result);
  
  // Extract sort order
  extractSortOrder(lowerInput, result);
  
  // Clean up the query by removing filter-related terms
  cleanupQuery(lowerInput, result);
  
  return result;
}

/**
 * Extracts price filters from the input.
 * 
 * @param input The lowercase input string.
 * @param result The result object to update.
 */
function extractPriceFilters(input: string, result: ParsedSearchQuery): void {
  // Match "under $X" or "less than $X"
  const underMatch = input.match(/under\s+\$?(\d+)/i) || input.match(/less than\s+\$?(\d+)/i);
  if (underMatch && underMatch[1]) {
    result.filters.maxPrice = parseInt(underMatch[1]);
  }
  
  // Match "over $X" or "more than $X"
  const overMatch = input.match(/over\s+\$?(\d+)/i) || input.match(/more than\s+\$?(\d+)/i);
  if (overMatch && overMatch[1]) {
    result.filters.minPrice = parseInt(overMatch[1]);
  }
  
  // Match "between $X and $Y"
  const betweenMatch = input.match(/between\s+\$?(\d+)\s+and\s+\$?(\d+)/i);
  if (betweenMatch && betweenMatch[1] && betweenMatch[2]) {
    result.filters.minPrice = parseInt(betweenMatch[1]);
    result.filters.maxPrice = parseInt(betweenMatch[2]);
  }
  
  // Match price range "$X-$Y"
  const rangeMatch = input.match(/\$?(\d+)\s*-\s*\$?(\d+)/i);
  if (rangeMatch && rangeMatch[1] && rangeMatch[2]) {
    result.filters.minPrice = parseInt(rangeMatch[1]);
    result.filters.maxPrice = parseInt(rangeMatch[2]);
  }
  
  // Match "cheap" or "budget"
  if (input.includes('cheap') || input.includes('budget') || input.includes('inexpensive')) {
    result.filters.maxPrice = result.filters.maxPrice || 300; // Default "cheap" threshold
  }
  
  // Match "expensive" or "premium"
  if (input.includes('expensive') || input.includes('premium') || input.includes('high-end')) {
    result.filters.minPrice = result.filters.minPrice || 800; // Default "expensive" threshold
  }
}

/**
 * Extracts brand filters from the input.
 * 
 * @param input The lowercase input string.
 * @param result The result object to update.
 */
function extractBrandFilters(input: string, result: ParsedSearchQuery): void {
  // List of common brands
  const commonBrands = [
    'samsung', 'apple', 'xiaomi', 'huawei', 'oppo', 'vivo', 'realme', 'oneplus', 'nokia', 'sony',
    'lg', 'motorola', 'asus', 'lenovo', 'acer', 'dell', 'hp', 'microsoft', 'toshiba', 'msi',
    'gigabyte', 'razer', 'logitech', 'corsair', 'steelseries', 'hyperx', 'jbl', 'bose', 'sony',
    'sennheiser', 'audio-technica', 'beats', 'philips', 'panasonic', 'canon', 'nikon', 'fujifilm',
    'gopro', 'dji', 'nintendo', 'playstation', 'xbox', 'fitbit', 'garmin', 'casio', 'seiko',
    'citizen', 'fossil', 'timex', 'rolex', 'omega', 'tag heuer', 'tissot', 'longines', 'bulova',
  ];
  
  // Check for brand mentions
  for (const brand of commonBrands) {
    if (input.includes(brand)) {
      result.filters.brand = brand.charAt(0).toUpperCase() + brand.slice(1); // Capitalize brand name
      break;
    }
  }
}

/**
 * Extracts rating filters from the input.
 * 
 * @param input The lowercase input string.
 * @param result The result object to update.
 */
function extractRatingFilters(input: string, result: ParsedSearchQuery): void {
  // Match "X stars" or "X star rating"
  const starsMatch = input.match(/(\d+)\s+stars?/i) || input.match(/(\d+)\s+star\s+rating/i);
  if (starsMatch && starsMatch[1]) {
    result.filters.minRating = parseInt(starsMatch[1]);
  }
  
  // Match "rated X or higher"
  const ratedMatch = input.match(/rated\s+(\d+)\s+or\s+higher/i);
  if (ratedMatch && ratedMatch[1]) {
    result.filters.minRating = parseInt(ratedMatch[1]);
  }
  
  // Match "good reviews" or "highly rated"
  if (input.includes('good reviews') || input.includes('highly rated') || input.includes('well reviewed')) {
    result.filters.minRating = result.filters.minRating || 4; // Default "good" rating threshold
  }
  
  // Match "best" or "top rated"
  if (input.includes('best') || input.includes('top rated') || input.includes('highest rated')) {
    result.filters.minRating = result.filters.minRating || 4.5; // Default "best" rating threshold
  }
}

/**
 * Extracts platform filters from the input.
 * 
 * @param input The lowercase input string.
 * @param result The result object to update.
 */
function extractPlatformFilters(input: string, result: ParsedSearchQuery): void {
  const platforms: string[] = [];
  
  // Check for platform mentions
  if (input.includes('shopee')) {
    platforms.push('Shopee');
  }
  
  if (input.includes('lazada')) {
    platforms.push('Lazada');
  }
  
  if (platforms.length > 0) {
    result.platforms = platforms;
  }
}

/**
 * Extracts sort order from the input.
 * 
 * @param input The lowercase input string.
 * @param result The result object to update.
 */
function extractSortOrder(input: string, result: ParsedSearchQuery): void {
  // Sort by price (low to high)
  if (input.includes('cheapest') || 
      input.includes('lowest price') || 
      input.includes('price low to high') || 
      input.includes('sort by price')) {
    result.sortBy = 'price_asc';
  }
  
  // Sort by price (high to low)
  if (input.includes('most expensive') || 
      input.includes('highest price') || 
      input.includes('price high to low')) {
    result.sortBy = 'price_desc';
  }
  
  // Sort by rating
  if (input.includes('best rated') || 
      input.includes('highest rated') || 
      input.includes('sort by rating')) {
    result.sortBy = 'rating_desc';
  }
  
  // Sort by popularity
  if (input.includes('most popular') || 
      input.includes('bestselling') || 
      input.includes('best selling') || 
      input.includes('sort by popularity')) {
    result.sortBy = 'popularity_desc';
  }
}

/**
 * Cleans up the query by removing filter-related terms.
 * 
 * @param input The lowercase input string.
 * @param result The result object to update.
 */
function cleanupQuery(input: string, result: ParsedSearchQuery): void {
  let query = result.query;
  
  // Remove price-related terms
  query = query.replace(/under\s+\$?(\d+)/i, '');
  query = query.replace(/less than\s+\$?(\d+)/i, '');
  query = query.replace(/over\s+\$?(\d+)/i, '');
  query = query.replace(/more than\s+\$?(\d+)/i, '');
  query = query.replace(/between\s+\$?(\d+)\s+and\s+\$?(\d+)/i, '');
  query = query.replace(/\$?(\d+)\s*-\s*\$?(\d+)/i, '');
  query = query.replace(/cheap|budget|inexpensive/i, '');
  query = query.replace(/expensive|premium|high-end/i, '');
  
  // Remove rating-related terms
  query = query.replace(/(\d+)\s+stars?/i, '');
  query = query.replace(/(\d+)\s+star\s+rating/i, '');
  query = query.replace(/rated\s+(\d+)\s+or\s+higher/i, '');
  query = query.replace(/good reviews|highly rated|well reviewed/i, '');
  query = query.replace(/best|top rated|highest rated/i, '');
  
  // Remove platform-related terms
  query = query.replace(/on shopee|from shopee|at shopee/i, '');
  query = query.replace(/on lazada|from lazada|at lazada/i, '');
  
  // Remove sort-related terms
  query = query.replace(/cheapest|lowest price|price low to high|sort by price/i, '');
  query = query.replace(/most expensive|highest price|price high to low/i, '');
  query = query.replace(/best rated|highest rated|sort by rating/i, '');
  query = query.replace(/most popular|bestselling|best selling|sort by popularity/i, '');
  
  // Remove filler words
  query = query.replace(/find|show|get|me|a|the|some|for/gi, '');
  
  // Clean up whitespace
  query = query.replace(/\s+/g, ' ').trim();
  
  // Update the result
  result.query = query;
}
