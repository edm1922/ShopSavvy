// Test file to check Supabase connection
const { createClient } = require('@supabase/supabase-js');

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey);

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test connection
async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    const { data, error } = await supabase.from('test').select('*').limit(1);
    
    if (error) {
      console.error('Supabase error:', error);
    } else {
      console.log('Supabase connection successful!');
      console.log('Data:', data);
    }
  } catch (err) {
    console.error('Error testing Supabase connection:', err);
  }
}

testConnection();
