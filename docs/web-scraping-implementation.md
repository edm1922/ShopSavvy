# Web Scraping Implementation Plan for ShopSavvy

## Overview
This document outlines the implementation plan for the web scraping approach to gather product data from e-commerce platforms like Kily Philippines and Lazada without relying on official APIs.

## Architecture

### 1. Scraper Interface
We'll create a unified interface that all platform-specific scrapers will implement:

```typescript
// src/services/scrapers/types.ts
export interface ScraperInterface {
  searchProducts(query: string, filters?: SearchFilters): Promise<Product[]>;
  getProductDetails(productId: string): Promise<ProductDetails | null>;
  getProductReviews?(productId: string, page?: number): Promise<ProductReview[]>;
  getCategoryProducts?(categoryId: string, page?: number): Promise<Product[]>;
}
```

### 2. Platform-Specific Scrapers
Each e-commerce platform will have its own scraper implementation:

```typescript
// src/services/scrapers/kily-scraper.ts
export class KilyScraper implements ScraperInterface {
  // Implementation for Kily Philippines
}

// src/services/scrapers/lazada-scraper.ts
export class LazadaScraper implements ScraperInterface {
  // Implementation for Lazada
}
```

### 3. Scraper Factory
A factory pattern to get the appropriate scraper:

```typescript
// src/services/scrapers/scraper-factory.ts
export function getScraperForPlatform(platform: string): ScraperInterface {
  switch (platform.toLowerCase()) {
    case 'kily philippines':
      return new KilyScraper();
    case 'lazada':
      return new LazadaScraper();
    // Add more platforms as needed
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}
```

### 4. Unified Service
A unified service that coordinates scraping across multiple platforms:

```typescript
// src/services/product-service.ts
export class ProductService {
  async searchAcrossPlatforms(query: string, platforms: string[], filters?: SearchFilters): Promise<Product[]> {
    // Implementation to search across multiple platforms
  }
}
```

## Implementation Details

### HTTP Client
We'll use Axios for HTTP requests with the following features:
- Custom user agents
- Request throttling
- Automatic retries
- Cookie management
- Proxy rotation

```typescript
// src/services/scrapers/http-client.ts
export class HttpClient {
  // Implementation with the features mentioned above
}
```

### HTML Parsing
We'll use Cheerio for HTML parsing:

```typescript
// Example of parsing product data with Cheerio
import * as cheerio from 'cheerio';

function parseProductList(html: string): Product[] {
  const $ = cheerio.load(html);
  const products: Product[] = [];

  $('.product-item').each((_, element) => {
    // Extract product data
    const product: Product = {
      id: $(element).attr('data-product-id') || '',
      title: $(element).find('.product-title').text().trim(),
      price: parseFloat($(element).find('.product-price').text().replace(/[^0-9.]/g, '')),
      // ... other properties
    };
    products.push(product);
  });

  return products;
}
```

### Headless Browser (for JavaScript-heavy sites)
For sites that rely heavily on JavaScript, we'll use Puppeteer:

```typescript
// src/services/scrapers/browser-client.ts
import puppeteer from 'puppeteer';

export class BrowserClient {
  private browser: puppeteer.Browser | null = null;

  async initialize() {
    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  async getPageContent(url: string): Promise<string> {
    if (!this.browser) await this.initialize();
    const page = await this.browser!.newPage();

    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    await page.goto(url, { waitUntil: 'networkidle2' });
    const content = await page.content();
    await page.close();

    return content;
  }

  async close() {
    if (this.browser) await this.browser.close();
    this.browser = null;
  }
}
```

## Caching Strategy
To reduce the number of requests and improve performance:

```typescript
// src/services/cache/cache-service.ts
export class CacheService {
  private cache: Map<string, { data: any, timestamp: number }> = new Map();
  private readonly TTL: number; // Time to live in milliseconds

  constructor(ttlSeconds: number = 3600) {
    this.TTL = ttlSeconds * 1000;
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.TTL) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  set(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  invalidateAll(): void {
    this.cache.clear();
  }
}
```

## Rate Limiting
To be respectful of the target websites:

```typescript
// src/services/scrapers/rate-limiter.ts
export class RateLimiter {
  private readonly requestsPerMinute: number;
  private requestTimestamps: number[] = [];

  constructor(requestsPerMinute: number = 20) {
    this.requestsPerMinute = requestsPerMinute;
  }

  async waitForSlot(): Promise<void> {
    const now = Date.now();
    this.requestTimestamps = this.requestTimestamps.filter(
      timestamp => now - timestamp < 60000
    );

    if (this.requestTimestamps.length >= this.requestsPerMinute) {
      const oldestRequest = this.requestTimestamps[0];
      const waitTime = 60000 - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.requestTimestamps.push(Date.now());
  }
}
```

## Error Handling
Robust error handling for scraping failures:

```typescript
// src/services/scrapers/error-handler.ts
export class ScraperError extends Error {
  constructor(
    message: string,
    public readonly platform: string,
    public readonly url?: string,
    public readonly statusCode?: number,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'ScraperError';
  }
}

export function handleScraperError(error: any, platform: string, url?: string): never {
  if (error instanceof ScraperError) throw error;

  if (error.response) {
    throw new ScraperError(
      `HTTP error: ${error.response.status}`,
      platform,
      url,
      error.response.status,
      error
    );
  }

  throw new ScraperError(
    error.message || 'Unknown scraper error',
    platform,
    url,
    undefined,
    error
  );
}
```

## Implementation Roadmap

1. **Week 1: Basic Infrastructure**
   - Set up HTTP client with user agent rotation
   - Implement basic rate limiting
   - Create caching layer
   - Set up error handling

2. **Week 1-2: Platform-Specific Scrapers**
   - Implement Kily Philippines scraper
   - Implement Lazada scraper
   - Create unified interface

3. **Week 2: Testing & Refinement**
   - Create test suite for scrapers
   - Implement retry mechanisms
   - Add proxy rotation (if needed)
   - Refine error handling

4. **Week 3: Integration**
   - Integrate scrapers with the main application
   - Replace mock data with real scraped data
   - Implement search across platforms

## Legal Considerations

1. **Terms of Service**
   - Review the Terms of Service of target websites
   - Ensure compliance with robots.txt
   - Implement respectful scraping practices

2. **Data Usage**
   - Only store necessary data
   - Attribute data sources appropriately
   - Do not scrape personal information

3. **Rate Limiting**
   - Implement conservative rate limits
   - Add random delays between requests
   - Use caching to reduce request volume

## Monitoring & Maintenance

1. **Scraper Health Monitoring**
   - Implement logging for scraper activities
   - Create alerts for scraper failures
   - Set up periodic tests to verify scraper functionality

2. **Adaptation to Website Changes**
   - Plan for regular reviews of scraper code
   - Implement detection of HTML structure changes
   - Create a process for quickly updating scrapers when target sites change
