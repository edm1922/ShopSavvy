/**
 * Script to create cache tables in Supabase.
 */

// Load environment variables
import './load-env';

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Creates the cache tables in Supabase.
 */
async function createCacheTables() {
  console.log('Creating cache tables in Supabase...');

  try {
    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'supabase', 'migrations', '20240610_search_cache.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error('Error creating tables:', error);
    } else {
      console.log('Cache tables created successfully!');
    }
  } catch (error) {
    console.error('Error creating cache tables:', error);
  }
}

// Run the function
createCacheTables().catch(console.error);
