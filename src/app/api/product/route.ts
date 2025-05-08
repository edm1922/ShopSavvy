/**
 * API route for getting product details.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getScraperForPlatform } from '@/services/scrapers/scraper-factory-server';

/**
 * Handles GET requests to the product details API.
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
    
    console.log(`Getting product details for ${productId} on ${platform}`);
    
    // Get the product details
    try {
      const scraper = getScraperForPlatform(platform);
      const product = await scraper.getProductDetails(productId);
      
      if (!product) {
        return NextResponse.json({
          success: false,
          error: 'Product not found',
        }, { status: 404 });
      }
      
      // Return the product details
      return NextResponse.json({
        success: true,
        product,
      });
    } catch (error) {
      console.error(`Error getting product details for ${productId} on ${platform}:`, error);
      
      return NextResponse.json({
        success: false,
        error: `Error getting product details: ${error.message}`,
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error processing product details request:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error processing product details request',
    }, { status: 500 });
  }
}
