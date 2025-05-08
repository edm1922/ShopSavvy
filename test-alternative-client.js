// Test with alternative client configuration
const { createClient } = require('@supabase/supabase-js');

// Hardcoded Supabase credentials
const SUPABASE_URL = 'https://olazrafayxrpqyajufle.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sYXpyYWZheXhycHF5YWp1ZmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTc0MzA0MzcsImV4cCI6MjAzMzAwNjQzN30.Yd_QlIFR-9xKVIxzP-DiDzvYJI7W1ZK5UUXpLznOlpQ';

// User credentials to test
const TEST_EMAIL = 'edronmaguale635@gmail.com';
const TEST_PASSWORD = 'tripz0219';

console.log('Testing with alternative client configuration:');
console.log('Email:', TEST_EMAIL);
console.log('Supabase URL:', SUPABASE_URL);
console.log('Supabase Key (first 10 chars):', SUPABASE_ANON_KEY.substring(0, 10));

// Create Supabase client with alternative configuration
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY
    }
  }
});

// Test authentication
async function testAuth() {
  try {
    console.log('\n1. Testing session...');
    const sessionResult = await supabase.auth.getSession();
    console.log('Session result:', sessionResult.error ? 'ERROR' : 'OK');
    if (sessionResult.error) console.error(sessionResult.error);
    
    console.log('\n2. Testing sign in with provided credentials...');
    
    const signInResult = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });
    
    console.log('Sign in result:', signInResult.error ? 'ERROR' : 'OK');
    
    if (signInResult.error) {
      console.error('Sign in error:', signInResult.error);
    } else {
      console.log('Sign in successful!');
      console.log('User ID:', signInResult.data.user.id);
      console.log('Session:', signInResult.data.session ? 'Active' : 'None');
    }
    
  } catch (err) {
    console.error('Test error:', err);
  }
}

testAuth();
