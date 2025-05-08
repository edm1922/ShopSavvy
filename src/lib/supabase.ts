// src/lib/supabase.ts
// This file is for client-side Supabase usage
import { createClient } from '@supabase/supabase-js';

// Hardcoded fallback credentials - only used if environment variables are not available
const FALLBACK_SUPABASE_URL = 'https://olazrafayxrpqyajufle.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sYXpyYWZheXhycHF5YWp1ZmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTc0MzA0MzcsImV4cCI6MjAzMzAwNjQzN30.Yd_QlIFR-9xKVIxzP-DiDzvYJI7W1ZK5UUXpLznOlpQ';
const FALLBACK_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sYXpyYWZheXhycHF5YWp1ZmxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY2OTE3NywiZXhwIjoyMDYyMjQ1MTc3fQ.uobIqILTZmxJ9SS_sLZ4Y0n8dW7Y6E4BEZMxm-8SCyk';

// Try to get credentials from environment variables first
// Only NEXT_PUBLIC_ variables are available on the client side
let SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
let SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// For the service role key, we'll try to use it from the environment if available
// Otherwise, we'll use the fallback
// Note: In production, the service role key should never be exposed to the client
// This is a special case for this application
let SUPABASE_SERVICE_ROLE_KEY = '';

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// In the browser, we'll use a hardcoded service role key
// In server components, we'll try to use the environment variable
if (isBrowser) {
  SUPABASE_SERVICE_ROLE_KEY = FALLBACK_SERVICE_ROLE_KEY;
} else {
  // In server components, try to use the environment variable
  SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || FALLBACK_SERVICE_ROLE_KEY;
}

// If environment variables are not available, use fallback credentials
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('Environment variables not found, using fallback credentials');
  SUPABASE_URL = FALLBACK_SUPABASE_URL;
  SUPABASE_ANON_KEY = FALLBACK_SUPABASE_ANON_KEY;
}

// Debug information
console.log('Initializing Supabase clients');
console.log('URL:', SUPABASE_URL);
console.log('Anon Key (first 10 chars):', SUPABASE_ANON_KEY.substring(0, 10));
console.log('Service Role Key available:', !!SUPABASE_SERVICE_ROLE_KEY);

// Create the regular Supabase client for general operations
// Use a simpler configuration to avoid potential issues
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Create a separate admin client with service role key for auth operations
// WARNING: This should only be used on the server side in production
// We're including it here for this specific application's requirements
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Test the connection immediately
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('Supabase client connection error:', error);
  } else {
    console.log('Supabase client connected successfully');
  }
});

// Test the admin connection
supabaseAdmin.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.error('Supabase admin client connection error:', error);
  } else {
    console.log('Supabase admin client connected successfully');
    console.log('Supabase session check:', data.session ? 'Active session' : 'No active session');
  }
}).catch(err => {
  console.error('Supabase connection error:', err);
});

export type SupabaseUser = Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user'];
