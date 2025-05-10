import { NextRequest, NextResponse } from 'next/server';
import { CustomCrawler } from '@/services/custom-crawler';

// Track if a crawl is in progress
let crawlInProgress = false;

// Create a singleton instance
let crawler: CustomCrawler | null = null;

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Check if another crawl is already in progress
    if (crawlInProgress) {
      return NextResponse.json({
        success: false,
        error: 'Another crawl is already in progress. Please try again later.',
      }, { status: 429 }); // 429 Too Many Requests
    }

    // Set the flag to indicate a crawl is starting
    crawlInProgress = true;

    // Get the search parameters from the URL
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || '';
    const platformsParam = searchParams.get('platforms') || 'lazada,zalora';
    const useCache = searchParams.get('useCache') !== 'false'; // Default to true

    // Parse platforms and filter to only include Lazada and Zalora
    let platforms = platformsParam.split(',');
    platforms = platforms.filter(p => ['lazada', 'zalora'].includes(p.toLowerCase()));

    // Log if platforms were filtered
    if (platforms.length < platformsParam.split(',').length) {
      console.log('[CustomCrawler] Only Lazada and Zalora are enabled as we\'re focusing on fashion/beauty');
    }

    // Validate the query
    if (!query) {
      crawlInProgress = false;
      return NextResponse.json({
        success: false,
        error: 'Search query is required',
      }, { status: 400 });
    }

    console.log(`[DeepSeekAI] Searching for "${query}" on platforms: ${platforms.join(', ')}`);
    console.log('[DeepSeekAI] Use cache:', useCache);
    console.log('[DeepSeekAI] DeepSeek API Key available:', process.env.DEEPSEEK_API_KEY ? 'Yes' : 'No');

    // Initialize crawler if needed
    if (!crawler) {
      crawler = new CustomCrawler();
      await crawler.initialize();
    }

    // Search for products
    const results = await crawler.searchProducts(query, platforms);

    console.log(`[CustomCrawler] Found ${results.length} results`);

    // Log the breakdown of results by platform
    const resultsByPlatform = platforms.map(platform => {
      const platformResults = results.filter(product =>
        product.platform.toLowerCase() === platform.toLowerCase()
      );
      return {
        platform,
        count: platformResults.length
      };
    });

    console.log('[CustomCrawler] Results by platform:', resultsByPlatform);

    // Return the results
    return NextResponse.json({
      success: true,
      query,
      platforms,
      useCache,
      count: results.length,
      results,
    });
  } catch (error) {
    console.error('[CustomCrawler] Error processing search request:', error);

    return NextResponse.json({
      success: false,
      error: 'Error processing search request',
    }, { status: 500 });
  } finally {
    // Reset the flag when done
    crawlInProgress = false;
  }
}

// Clean up the crawler when the server shuts down
process.on('beforeExit', async () => {
  if (crawler) {
    await crawler.close();
    crawler = null;
  }
});
