// Test with service role key
const { createClient } = require('@supabase/supabase-js');

// Supabase credentials with service role key
const SUPABASE_URL = 'https://olazrafayxrpqyajufle.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sYXpyYWZheXhycHF5YWp1ZmxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY2OTE3NywiZXhwIjoyMDYyMjQ1MTc3fQ.uobIqILTZmxJ9SS_sLZ4Y0n8dW7Y6E4BEZMxm-8SCyk';

// User credentials to test
const TEST_EMAIL = 'edronmaguale635@gmail.com';
const TEST_PASSWORD = 'tripz0219';

console.log('Testing with service role key:');
console.log('Email:', TEST_EMAIL);
console.log('Supabase URL:', SUPABASE_URL);
console.log('Using service role key (first 10 chars):', SUPABASE_SERVICE_ROLE_KEY.substring(0, 10));

// Create Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
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
