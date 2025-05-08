# Custom Scraping + Caching System

This directory contains scripts to test and compare the custom scraping solution with the existing Serper.dev API implementation.

## Overview

The custom scraping solution uses Playwright to directly scrape e-commerce platforms like Shopee and Lazada, and caches the results in Supabase for improved performance. This approach eliminates the dependency on the Serper.dev API, which has credit limits.

## Setup

1. **Create the cache table in Supabase**:

   ```bash
   # Run the migration script
   npx ts-node src/scripts/run-migration.ts 20240610_search_cache.sql
   ```

2. **Set the feature flag in `.env.local`**:

   ```
   # Use Serper.dev API (default)
   NEXT_PUBLIC_USE_CUSTOM_SCRAPERS=false
   
   # Use custom scrapers
   NEXT_PUBLIC_USE_CUSTOM_SCRAPERS=true
   ```

## Testing

### Test Individual Scrapers

To test the individual scrapers for Shopee and Lazada:

```bash
npx ts-node src/scripts/scraper-test/index.ts
```

This will run test searches for various queries and save the results in the `src/scripts/scraper-test/results` directory.

### Compare with Serper.dev API

To compare the custom scrapers with the Serper.dev API:

```bash
npx ts-node src/scripts/scraper-test/compare.ts
```

This will run the same searches using both implementations and save comparison results in the `src/scripts/scraper-test/results` directory.

## Implementation Details

### Components

1. **Platform-specific scrapers**:
   - `src/services/scrapers/shopee-scraper.ts`
   - `src/services/scrapers/lazada-scraper.ts`

2. **Caching system**:
   - `src/services/cache/supabase-cache.ts`
   - `supabase/migrations/20240610_search_cache.sql`

3. **Search services**:
   - `src/services/search/custom-universal-search.ts` - Custom scraper implementation
   - `src/services/search/universal-search.ts` - Existing Serper.dev implementation
   - `src/services/search/index.ts` - Unified service that switches based on feature flag

4. **Feature flag**:
   - `src/config/features.ts`
   - `NEXT_PUBLIC_USE_CUSTOM_SCRAPERS` in `.env.local`

### How It Works

1. When a search is requested, the unified search service checks the feature flag.
2. If custom scrapers are enabled, it first checks the cache for existing results.
3. If no cache hit, it runs the platform-specific scrapers in parallel.
4. Results are merged, deduplicated, and cached for future use.
5. The cache has a TTL (Time To Live) of 6 hours by default.

## Comparison with Serper.dev API

The custom scraping solution offers several advantages:

1. **No API Credit Limits**: Eliminates dependency on third-party API credits.
2. **More Control**: Direct access to the source data without intermediaries.
3. **Customization**: Can be tailored to extract specific data from each platform.
4. **Cost-Effective**: No ongoing API costs beyond hosting.

Potential disadvantages:

1. **Maintenance**: Requires updating scrapers when websites change.
2. **Performance**: May be slower than API calls for uncached searches.
3. **Reliability**: Subject to anti-scraping measures from the target websites.

## Next Steps

1. **Thorough Testing**: Test with a variety of queries and monitor performance.
2. **Gradual Rollout**: Use the feature flag to gradually roll out to users.
3. **Monitoring**: Implement logging to track cache hit rates and scraper success rates.
4. **Optimization**: Improve scraper reliability and performance based on real-world usage.
5. **Add More Platforms**: Implement scrapers for additional e-commerce platforms.
