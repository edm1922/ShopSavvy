/**
 * API route for user email preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://olazrafayxrpqyajufle.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sYXpyYWZheXhycHF5YWp1ZmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTc0MzA0MzcsImV4cCI6MjAzMzAwNjQzN30.Yd_QlIFR-9xKVIxzP-DiDzvYJI7W1ZK5UUXpLznOlpQ';
const supabase = createClient(supabaseUrl, supabaseKey);

// Default email preferences
const defaultPreferences = {
  priceAlerts: true,
  weeklyDigest: true,
  specialOffers: false,
  accountNotifications: true
};

/**
 * Handles GET requests to the email preferences API.
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
    
    // Get the user's email preferences
    const { data, error } = await supabase
      .from('profiles')
      .select('email_preferences')
      .eq('id', session.user.id)
      .single();
    
    if (error) {
      console.error('Error getting email preferences:', error);
      
      return NextResponse.json({
        success: false,
        error: 'Error getting email preferences',
      }, { status: 500 });
    }
    
    // Return the preferences (or defaults if not set)
    const preferences = data?.email_preferences || defaultPreferences;
    
    return NextResponse.json({
      success: true,
      preferences,
    });
  } catch (error) {
    console.error('Error processing email preferences request:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error processing email preferences request',
    }, { status: 500 });
  }
}

/**
 * Handles POST requests to the email preferences API.
 * 
 * @param request The Next.js request object.
 * @returns A promise that resolves to a Next.js response.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
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
    const { preferences } = body as { preferences: Record<string, boolean> };
    
    // Validate the preferences
    if (!preferences) {
      return NextResponse.json({
        success: false,
        error: 'Preferences are required',
      }, { status: 400 });
    }
    
    // Update the user's email preferences
    const { error } = await supabase
      .from('profiles')
      .update({
        email_preferences: preferences,
        updated_at: new Date().toISOString()
      })
      .eq('id', session.user.id);
    
    if (error) {
      console.error('Error updating email preferences:', error);
      
      return NextResponse.json({
        success: false,
        error: 'Error updating email preferences',
      }, { status: 500 });
    }
    
    // Return success
    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error processing email preferences update:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error processing email preferences update',
    }, { status: 500 });
  }
}
