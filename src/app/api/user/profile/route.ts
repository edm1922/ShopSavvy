/**
 * API route for user profile
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://olazrafayxrpqyajufle.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sYXpyYWZheXhycHF5YWp1ZmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTc0MzA0MzcsImV4cCI6MjAzMzAwNjQzN30.Yd_QlIFR-9xKVIxzP-DiDzvYJI7W1ZK5UUXpLznOlpQ';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Handles GET requests to the user profile API.
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
    
    // Get the user's profile
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();
    
    if (error) {
      console.error('Error getting user profile:', error);
      
      return NextResponse.json({
        success: false,
        error: 'Error getting user profile',
      }, { status: 500 });
    }
    
    // Return the profile
    return NextResponse.json({
      success: true,
      profile: data,
    });
  } catch (error) {
    console.error('Error processing user profile request:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error processing user profile request',
    }, { status: 500 });
  }
}

/**
 * Handles POST requests to the user profile API.
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
    const { fullName, avatarUrl } = body as { 
      fullName?: string; 
      avatarUrl?: string;
    };
    
    // Update user metadata
    const updateData: Record<string, any> = {};
    
    if (fullName !== undefined) {
      updateData.full_name = fullName;
    }
    
    if (avatarUrl !== undefined) {
      updateData.avatar_url = avatarUrl;
    }
    
    // Update the user's metadata
    const { error: authError } = await supabase.auth.updateUser({
      data: updateData
    });
    
    if (authError) {
      console.error('Error updating user metadata:', authError);
      
      return NextResponse.json({
        success: false,
        error: 'Error updating user metadata',
      }, { status: 500 });
    }
    
    // Update the profiles table
    const profileData: Record<string, any> = {
      updated_at: new Date().toISOString()
    };
    
    if (fullName !== undefined) {
      profileData.full_name = fullName;
    }
    
    if (avatarUrl !== undefined) {
      profileData.avatar_url = avatarUrl;
    }
    
    const { error: profileError } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('id', session.user.id);
    
    if (profileError) {
      console.error('Error updating profile:', profileError);
      
      return NextResponse.json({
        success: false,
        error: 'Error updating profile',
      }, { status: 500 });
    }
    
    // Return success
    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error processing profile update:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Error processing profile update',
    }, { status: 500 });
  }
}
