/**
 * Script to apply the price history migration to Supabase
 * 
 * This script reads the price history migration SQL file and applies it to the Supabase database.
 * 
 * Usage: node scripts/apply-price-history-migration.js
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://olazrafayxrpqyajufle.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sYXpyYWZheXhycHF5YWp1ZmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTc0MzA0MzcsImV4cCI6MjAzMzAwNjQzN30.Yd_QlIFR-9xKVIxzP-DiDzvYJI7W1ZK5UUXpLznOlpQ';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Run the migration
 */
async function runMigration() {
  try {
    console.log('Setting up price history table in Supabase...');
    
    // Get the migration file path
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20240801_price_history.sql');
    
    // Check if the file exists
    if (!fs.existsSync(migrationPath)) {
      console.error(`Migration file not found: ${migrationPath}`);
      process.exit(1);
    }
    
    // Read the migration file
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the SQL
    try {
      // First try using the pgmigrate function
      const { error } = await supabase.rpc('pgmigrate', { sql });
      
      if (error) {
        // If pgmigrate doesn't exist, try exec_sql
        if (error.message.includes('function "pgmigrate" does not exist')) {
          console.log('pgmigrate function not found, trying exec_sql...');
          
          const { error: execError } = await supabase.rpc('exec_sql', { sql });
          
          if (execError) {
            // If exec_sql doesn't exist either, try running the SQL directly
            if (execError.message.includes('function "exec_sql" does not exist')) {
              console.log('exec_sql function not found, running SQL directly...');
              
              // Split the SQL into individual statements
              const statements = sql.split(';').filter(stmt => stmt.trim());
              
              // Execute each statement
              for (const statement of statements) {
                if (statement.trim()) {
                  const { error: stmtError } = await supabase.rpc('exec', { sql: statement });
                  
                  if (stmtError) {
                    // If all methods fail, we need to run the migration manually
                    console.error('Error running SQL statement:', stmtError);
                    console.error('Please run the migration manually in the Supabase dashboard');
                    console.log('SQL to run:');
                    console.log(sql);
                    process.exit(1);
                  }
                }
              }
              
              console.log('Migration completed successfully');
            } else {
              console.error('Error running migration with exec_sql:', execError);
              console.error('Please run the migration manually in the Supabase dashboard');
              console.log('SQL to run:');
              console.log(sql);
              process.exit(1);
            }
          } else {
            console.log('Migration completed successfully');
          }
        } else {
          console.error('Error running migration with pgmigrate:', error);
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
      console.error('Please run the migration manually in the Supabase dashboard');
      console.log('SQL to run:');
      console.log(sql);
      process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration().catch(console.error);
