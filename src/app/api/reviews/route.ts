/**
 * API route for getting product reviews.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getScraperForPlatform } from '@/services/scrapers/scraper-factory-server';

/**
 * Handles GET requests to the product reviews API.
 * 
 * @param request The Next.js request object.
 * @returns A promise that resolves to a Next.js response.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get the product parameters from the URL
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get('id');
    const platform = searchParams.get('platform');
    const pageParam = searchParams.get('page');
    
    // Parse the page parameter
    const page = pageParam ? parseInt(pageParam, 10) : 1;
    
    // Validate the parameters
    if (!productId) {
      return NextResponse.json({
        success: false,
        error: 'Product ID is required',
      }, { status: 400 });
    }
    
    if (!platform) {
      return NextResponse.json({
        success: false,
        error: 'Platform is required',
      }, { status: 400 });
    }
    
    console.log(`Getting product reviews for ${productId} on ${platform} (page ${page})`);
    
    // Get the product reviews
    try {
      const scraper = getScraperForPlatform(platform);
      const reviews = await scraper.getProductReviews(productId, page);
      
      // Return the reviews
      return NextResponse.json({
        success: true,
        reviews,
        page,
        count: reviews.length,
      });
    } catch (error) {
      console.error(`Error getting product reviews for ${productId} on ${platform}:`, error);
      
      return NextResponse.json({
        success: false,
        error: `Error getting product reviews: ${error.message}`,
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error processing product reviews request:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error processing product reviews request',
    }, { status: 500 });
  }
}
