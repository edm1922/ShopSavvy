/**
 * Script to set up the Serper.dev API cache table in Supabase
 * 
 * This script creates the serper_search_cache table in Supabase.
 * 
 * Usage: node scripts/setup-serper-cache.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://olazrafayxrpqyajufle.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sYXpyYWZheXhycHF5YWp1ZmxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY2OTE3NywiZXhwIjoyMDYyMjQ1MTc3fQ.uobIqILTZmxJ9SS_sLZ4Y0n8dW7Y6E4BEZMxm-8SCyk';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Run the migration
 */
async function runMigration() {
  try {
    console.log('Setting up Serper.dev API cache table in Supabase...');
    
    // Get the migration file path
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20240701_serper_search_cache.sql');
    
    // Check if the file exists
    if (!fs.existsSync(migrationPath)) {
      console.error(`Migration file not found: ${migrationPath}`);
      process.exit(1);
    }
    
    // Read the migration file
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the SQL directly
    const { error } = await supabase.rpc('pgmigrate', { sql });
    
    if (error) {
      // If the pgmigrate function doesn't exist, try running the SQL directly
      if (error.message.includes('function "pgmigrate" does not exist')) {
        console.log('pgmigrate function not found, running SQL directly...');
        
        // Split the SQL into individual statements
        const statements = sql.split(';').filter(stmt => stmt.trim());
        
        // Execute each statement
        for (const statement of statements) {
          if (statement.trim()) {
            const { error } = await supabase.rpc('exec', { sql: statement });
            if (error) {
              // If exec function doesn't exist either, we can't run the migration
              console.error('Error running SQL statement:', error);
              console.error('Please run the migration manually in the Supabase dashboard');
              console.log('SQL to run:');
              console.log(sql);
              process.exit(1);
            }
          }
        }
        
        console.log('Migration completed successfully');
      } else {
        console.error('Error running migration:', error);
        console.error('Please run the migration manually in the Supabase dashboard');
        console.log('SQL to run:');
        console.log(sql);
        process.exit(1);
      }
    } else {
      console.log('Migration completed successfully');
    }
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration().catch(console.error);
