/**
 * API route for price alerts
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  createPriceAlert,
  getUserPriceAlerts,
  deletePriceAlert,
  updatePriceAlert
} from '@/services/price-history-service';
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
 * Handles GET requests to the price alerts API.
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

    // Get the user's price alerts
    const alerts = await getUserPriceAlerts(session.user.id);

    // Return the alerts
    return NextResponse.json({
      success: true,
      alerts,
    });
  } catch (error) {
    console.error('Error processing price alerts request:', error);

    return NextResponse.json({
      success: false,
      error: 'Error processing price alerts request',
    }, { status: 500 });
  }
}

/**
 * Handles POST requests to the price alerts API.
 *
 * @param request The Next.js request object.
 * @returns A promise that resolves to a Next.js response.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get the user's session
    const { data: { session } } = await supabase.auth.getSession();

    // Check for authorization header as a fallback
    const authHeader = request.headers.get('Authorization');
    let userId = session?.user?.id;

    // If no session but we have an auth header, try to get the user from the token
    if (!userId && authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];

      if (token) {
        try {
          // Verify the token and get the user
          const { data, error } = await supabase.auth.getUser(token);

          if (!error && data.user) {
            userId = data.user.id;
          }
        } catch (tokenError) {
          console.error('Error verifying token:', tokenError);
        }
      }
    }

    // If still no user ID, return authentication error
    if (!userId) {
      console.error('Authentication required - No valid session or token found');
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }

    // Get the request body
    const body = await request.json();
    const { product, targetPrice } = body as { product: Product; targetPrice: number };

    // Validate the parameters
    if (!product) {
      return NextResponse.json({
        success: false,
        error: 'Product data is required',
      }, { status: 400 });
    }

    if (targetPrice === undefined || targetPrice <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Valid target price is required',
      }, { status: 400 });
    }

    console.log(`Creating price alert for product ${product.id} for user ${userId} with target price ${targetPrice}`);

    // Create the price alert
    const success = await createPriceAlert(
      userId,
      product,
      targetPrice
    );

    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Error creating price alert',
      }, { status: 500 });
    }

    // Return success
    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error processing price alert creation request:', error);

    return NextResponse.json({
      success: false,
      error: 'Error processing price alert creation request',
    }, { status: 500 });
  }
}

/**
 * Handles DELETE requests to the price alerts API.
 *
 * @param request The Next.js request object.
 * @returns A promise that resolves to a Next.js response.
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    // Get the user's session
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }

    // Get the alert ID from the URL
    const searchParams = request.nextUrl.searchParams;
    const alertId = searchParams.get('id');

    // Validate the parameters
    if (!alertId) {
      return NextResponse.json({
        success: false,
        error: 'Alert ID is required',
      }, { status: 400 });
    }

    // Delete the price alert
    const success = await deletePriceAlert(
      session.user.id,
      alertId
    );

    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Error deleting price alert',
      }, { status: 500 });
    }

    // Return success
    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error processing price alert deletion request:', error);

    return NextResponse.json({
      success: false,
      error: 'Error processing price alert deletion request',
    }, { status: 500 });
  }
}

/**
 * Handles PATCH requests to the price alerts API.
 *
 * @param request The Next.js request object.
 * @returns A promise that resolves to a Next.js response.
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    // Get the user's session
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }

    // Get the request body
    const body = await request.json();
    const { alertId, targetPrice, isActive } = body as {
      alertId: string;
      targetPrice?: number;
      isActive?: boolean
    };

    // Validate the parameters
    if (!alertId) {
      return NextResponse.json({
        success: false,
        error: 'Alert ID is required',
      }, { status: 400 });
    }

    // Update the price alert
    const success = await updatePriceAlert(
      session.user.id,
      alertId,
      { targetPrice, isActive }
    );

    if (!success) {
      return NextResponse.json({
        success: false,
        error: 'Error updating price alert',
      }, { status: 500 });
    }

    // Return success
    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error processing price alert update request:', error);

    return NextResponse.json({
      success: false,
      error: 'Error processing price alert update request',
    }, { status: 500 });
  }
}
