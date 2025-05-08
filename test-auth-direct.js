// Direct test of Supabase authentication
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key (first 10 chars):', supabaseAnonKey?.substring(0, 10));

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test authentication
async function testAuth() {
  try {
    console.log('1. Testing session...');
    const sessionResult = await supabase.auth.getSession();
    console.log('Session result:', sessionResult.error ? 'ERROR' : 'OK');
    if (sessionResult.error) console.error(sessionResult.error);
    
    // Test email/password sign-in
    console.log('\n2. Testing sign in...');
    const email = 'test@example.com';
    const password = 'password123';
    
    const signInResult = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    console.log('Sign in result:', signInResult.error ? 'ERROR' : 'OK');
    if (signInResult.error) {
      console.error('Sign in error:', signInResult.error);
    } else {
      console.log('Sign in successful!');
    }
    
    // Test sign up
    console.log('\n3. Testing sign up...');
    const signUpResult = await supabase.auth.signUp({
      email: `test${Date.now()}@example.com`,
      password: 'password123'
    });
    
    console.log('Sign up result:', signUpResult.error ? 'ERROR' : 'OK');
    if (signUpResult.error) {
      console.error('Sign up error:', signUpResult.error);
    } else {
      console.log('Sign up successful!');
    }
    
  } catch (err) {
    console.error('Test error:', err);
  }
}

testAuth();
