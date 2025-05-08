// Test with hardcoded credentials
const { createClient } = require('@supabase/supabase-js');

// Hardcoded credentials for testing
const SUPABASE_URL = 'https://olazrafayxrpqyajufle.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sYXpyYWZheXhycHF5YWp1ZmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTc0MzA0MzcsImV4cCI6MjAzMzAwNjQzN30.Yd_QlIFR-9xKVIxzP-DiDzvYJI7W1ZK5UUXpLznOlpQ';

console.log('Using hardcoded credentials:');
console.log('URL:', SUPABASE_URL);
console.log('Key (first 10 chars):', SUPABASE_ANON_KEY.substring(0, 10));

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
