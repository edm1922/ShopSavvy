/**
 * API route for price history
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getProductPriceHistory, trackProductPrice } from '@/services/price-history-service';
import { Product } from '@/services/types';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://olazrafayxrpqyajufle.supabase.co';

// Use the service role key for server-side operations
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sYXpyYWZheXhycHF5YWp1ZmxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY2OTE3NywiZXhwIjoyMDYyMjQ1MTc3fQ.uobIqILTZmxJ9SS_sLZ4Y0n8dW7Y6E4BEZMxm-8SCyk';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sYXpyYWZheXhycHF5YWp1ZmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTc0MzA0MzcsImV4cCI6MjAzMzAwNjQzN30.Yd_QlIFR-9xKVIxzP-DiDzvYJI7W1ZK5UUXpLznOlpQ';

// Use the service role key for API routes
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || serviceRoleKey;

console.log('API Route - Using Supabase URL:', supabaseUrl);
console.log('API Route - Using key type:', supabaseKey === serviceRoleKey ? 'service_role' : 'anon');

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
});

/**
 * Handles GET requests to the price history API.
 *
 * @param request The Next.js request object.
 * @returns A promise that resolves to a Next.js response.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get the user's session
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }

    // Get the product parameters from the URL
    const searchParams = request.nextUrl.searchParams;
    const productId = searchParams.get('productId');
    const days = searchParams.get('days') ? parseInt(searchParams.get('days')!) : 30;

    // Validate the parameters
    if (!productId) {
      return NextResponse.json({
        success: false,
        error: 'Product ID is required',
      }, { status: 400 });
    }

    // Get the price history
    const priceHistory = await getProductPriceHistory(
      session.user.id,
      productId,
      days
    );

    // Return the price history
    return NextResponse.json({
      success: true,
      priceHistory,
    });
  } catch (error) {
    console.error('Error processing price history request:', error);

    return NextResponse.json({
      success: false,
      error: 'Error processing price history request',
    }, { status: 500 });
  }
}

/**
 * Handles POST requests to the price history API.
 *
 * @param request The Next.js request object.
 * @returns A promise that resolves to a Next.js response.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('POST /api/price-history - Processing request');

    // Get the user's session
    const sessionResult = await supabase.auth.getSession();
    console.log('Session result:', sessionResult.error ? 'Error' : 'Success');

    const session = sessionResult.data.session;

    // Check for authorization header as a fallback
    const authHeader = request.headers.get('Authorization');
    console.log('Authorization header present:', !!authHeader);

    let userId = session?.user?.id;
    console.log('User ID from session:', userId || 'None');

    // If no session but we have an auth header, try to get the user from the token
    if (!userId && authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      console.log('Token from Authorization header:', token ? 'Present' : 'None');

      if (token) {
        try {
          // Verify the token and get the user
          const userResult = await supabase.auth.getUser(token);
          console.log('Get user result:', userResult.error ? 'Error' : 'Success');

          if (!userResult.error && userResult.data.user) {
            userId = userResult.data.user.id;
            console.log('User ID from token:', userId);
          }
        } catch (tokenError) {
          console.error('Error verifying token:', tokenError);
        }
      }
    }

    // If still no user ID, try to create a guest user
    if (!userId) {
      console.log('No authenticated user found, attempting to use guest user');

      // Use a fixed guest user ID for unauthenticated requests
      // In a production app, you might want to create temporary guest users
      userId = 'guest-user';
      console.log('Using guest user ID:', userId);
    }

    // Get the request body
    const body = await request.json();
    const { product } = body as { product: Product };

    // Validate the parameters
    if (!product) {
      console.log('Missing product data');
      return NextResponse.json({
        success: false,
        error: 'Product data is required',
      }, { status: 400 });
    }

    console.log(`Tracking price for product ${product.id} for user ${userId}`);
    console.log('Product details:', {
      title: product.title,
      price: product.price,
      platform: product.platform
    });

    // Track the product price
    const success = await trackProductPrice(
      userId,
      product
    );

    if (!success) {
      console.error('Failed to track product price');
      return NextResponse.json({
        success: false,
        error: 'Error tracking product price',
      }, { status: 500 });
    }

    console.log('Successfully tracked product price');

    // Return success
    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error processing price tracking request:', error);

    // Return a more detailed error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';

    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack
    });

    return NextResponse.json({
      success: false,
      error: 'Error processing price tracking request: ' + errorMessage,
    }, { status: 500 });
  }
}
