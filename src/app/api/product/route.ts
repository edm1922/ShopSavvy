/**
 * API route for getting product details using Serper.dev API.
 */

import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// Serper.dev API configuration
const SERPER_API_URL = 'https://google.serper.dev/shopping';
const SERPER_API_KEY = process.env.SERPER_API_KEY || '3986a10df3a191c663afa1d08d3929d1a47fb875';

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
    const productUrl = searchParams.get('url');

    // Validate the parameters
    if (!productId && !productUrl) {
      return NextResponse.json({
        success: false,
        error: 'Either Product ID or URL is required',
      }, { status: 400 });
    }

    if (!platform) {
      return NextResponse.json({
        success: false,
        error: 'Platform is required',
      }, { status: 400 });
    }

    console.log(`Getting product details for ${productId || productUrl} on ${platform}`);

    // For now, return the product information we already have
    // In a future update, we could implement a product details scraper
    // that uses the product URL to get more detailed information

    return NextResponse.json({
      success: true,
      product: {
        id: productId,
        platform: platform,
        url: productUrl,
        message: "Detailed product information is not available. This feature will be implemented in a future update."
      },
    });

  } catch (error: any) {
    console.error('Error processing product details request:', error);

    return NextResponse.json({
      success: false,
      error: 'Error processing product details request',
    }, { status: 500 });
  }
}
