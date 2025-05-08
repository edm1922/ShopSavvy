// src/lib/supabase-admin.ts
// This file should only be imported in server components or API routes
import { createClient } from '@supabase/supabase-js';

// Get credentials from environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Debug information
console.log('Initializing Supabase admin client with service role key');
console.log('URL:', SUPABASE_URL);
console.log('Service Role Key (first 10 chars):', SUPABASE_SERVICE_ROLE_KEY.substring(0, 10));

// Create admin client with service role key for auth operations
// This should only be used on the server side
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Export types
export type SupabaseAdmin = typeof supabaseAdmin;
