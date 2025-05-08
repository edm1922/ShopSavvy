# ShopSavvy Scripts

This directory contains utility scripts for testing and development of the ShopSavvy application.

## Available Scripts

### `test-serper-api.js`

Tests the Serper.dev API for product search functionality. This script is useful for verifying API functionality and testing different search queries.

#### Usage

```bash
node scripts/test-serper-api.js [query]
```

#### Example

```bash
node scripts/test-serper-api.js "iPhone 15"
```

#### Output

The script will:
1. Make a request to the Serper.dev API with the specified query
2. Display the search results in the console
3. Save the raw API response to a JSON file in the `scripts/output` directory
4. Provide an analysis of the API response, including:
   - Number of shopping results
   - Number of local results
   - Presence of knowledge graph
   - Search parameters
   - Product sources
   - Price analysis (min, max, average)

## API Evaluation

We evaluated both DuckDuckGo Instant Answer API and Serper.dev API for product search functionality and determined that Serper.dev is significantly better for ShopSavvy's needs:

### Serper.dev API (Selected)
- Consistently returns structured product data
- Provides rich product information (title, price, source, image URL)
- Returns results from multiple e-commerce platforms (Shopee, Lazada, etc.)
- Supports filtering and sorting options
- Requires an API key but offers more reliable results

### DuckDuckGo Instant Answer API (Rejected)
- Primarily provides informational content about topics
- Returns encyclopedia-like data from Wikipedia and other sources
- Contains very limited product information
- No structured product data (prices, sources, images, etc.)
- No filtering capabilities for e-commerce results
- Simple to use with no authentication required

## Implementation Considerations

1. **API Usage**: Use Serper.dev as the primary search API
2. **Fallback Strategy**: Consider using DuckDuckGo only as a fallback for general information about products, not for actual product search
3. **Caching**: Implement caching to reduce API calls to Serper.dev and manage costs
4. **Error Handling**: Ensure robust error handling for Serper.dev API calls
