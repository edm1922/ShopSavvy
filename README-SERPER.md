# ShopSavvy Serper.dev API Integration

This document describes the integration of Serper.dev API for product search in ShopSavvy.

## Overview

ShopSavvy now uses the Serper.dev API to search for products across multiple e-commerce platforms. This approach is simpler and more reliable than custom web scrapers, which were prone to breaking when websites changed their structure.

## Features

- **Simplified Search**: Uses Serper.dev API to search for products across multiple platforms
- **Weekly Caching**: Results are cached for 7 days to minimize API usage
- **Platform Filtering**: Results can be filtered by platform (Lazada, Zalora, Shein)
- **Price Filtering**: Results can be filtered by price range
- **Brand Filtering**: Results can be filtered by brand

## Implementation Details

### API Key

The Serper.dev API key is stored in the `.env.local` file:

```
SERPER_API_KEY=3986a10df3a191c663afa1d08d3929d1a47fb875
```

### Cache Table

The search results are cached in the `serper_search_cache` table in Supabase. The table has the following structure:

```sql
CREATE TABLE IF NOT EXISTS serper_search_cache (
  id BIGSERIAL PRIMARY KEY,
  query TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'ph',
  language TEXT NOT NULL DEFAULT 'en',
  results JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Create a unique constraint on query, country, and language
  UNIQUE(query, country, language)
);
```

### API Service

The Serper.dev API service is implemented in `src/services/serper-api.ts`. It provides the following functions:

- `searchProducts(query, options)`: Searches for products using the Serper.dev API

### Search API

The search API endpoint is implemented in `src/app/api/search/route.ts`. It accepts the following parameters:

- `query`: The search query
- `platforms`: Comma-separated list of platforms to search (default: 'lazada,zalora,shein')
- `maxPages`: Maximum number of pages to fetch (default: 1)
- `forceRefresh`: Whether to bypass the cache and fetch fresh results (default: false)
- `minPrice`: Minimum price filter
- `maxPrice`: Maximum price filter
- `brand`: Brand filter
- `sortBy`: Sort order ('price_asc', 'price_desc', 'rating_desc')

## Testing

You can test the Serper.dev API using the provided test script:

```bash
node scripts/test-serper-api.js "smartphone"
```

## Setup

To set up the Serper.dev API integration:

1. Make sure the Serper.dev API key is set in `.env.local`
2. Run the migration script to create the cache table:

```bash
node scripts/setup-serper-cache.js
```

## Credits

- [Serper.dev](https://serper.dev/) - Google Search API
- [Supabase](https://supabase.io/) - Database and caching
