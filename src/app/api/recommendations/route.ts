/**
 * API route for AI-powered fashion and beauty recommendations.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRecommendations, RecommendationParams } from '@/services/ai/deepseek-recommendations';
import { Product } from '@/services/types';

/**
 * Handles POST requests to the recommendations API.
 *
 * @param request The Next.js request object.
 * @returns A promise that resolves to a Next.js response.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse the request body
    const body = await request.json();

    // Extract parameters from the request
    const params: RecommendationParams = {
      query: body.query,
      userPreferences: body.userPreferences || [],
      recentSearches: body.recentSearches || [],
      recentlyViewedProducts: body.recentlyViewedProducts || [],
      budget: body.budget,
      category: body.category
    };

    // Get recommendations from the DeepSeek service
    const recommendations = await getRecommendations(params);

    // Return the recommendations
    return NextResponse.json({
      success: true,
      recommendations
    });
  } catch (error) {
    console.error('[RecommendationsAPI] Error processing request:', error);

    return NextResponse.json({
      success: false,
      error: 'Error processing recommendation request'
    }, { status: 500 });
  }
}

/**
 * Handles GET requests to the recommendations API.
 * This is a simplified version that uses default parameters.
 *
 * @param request The Next.js request object.
 * @returns A promise that resolves to a Next.js response.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get search parameters from the URL
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query') || undefined;
    const category = searchParams.get('category') || undefined;

    // Parse preferences if provided
    const preferencesParam = searchParams.get('preferences');
    const userPreferences = preferencesParam ? preferencesParam.split(',') : [];

    // Parse recent searches if provided
    const recentSearchesParam = searchParams.get('recentSearches');
    const recentSearches = recentSearchesParam ? recentSearchesParam.split(',') : [];

    // Parse budget if provided
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const budget = (minPrice || maxPrice) ? {
      min: minPrice ? parseFloat(minPrice) : undefined,
      max: maxPrice ? parseFloat(maxPrice) : undefined
    } : undefined;

    // Create parameters object
    const params: RecommendationParams = {
      query,
      userPreferences,
      recentSearches,
      budget,
      category
    };

    // Get recommendations from the DeepSeek service
    const recommendations = await getRecommendations(params);

    // Return the recommendations
    return NextResponse.json({
      success: true,
      recommendations
    });
  } catch (error) {
    console.error('[RecommendationsAPI] Error processing request:', error);

    return NextResponse.json({
      success: false,
      error: 'Error processing recommendation request'
    }, { status: 500 });
  }
}
