/**
 * Script to run SQL migrations in Supabase.
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase client with service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Runs a SQL migration file in Supabase.
 *
 * @param migrationFile The name of the migration file in the supabase/migrations directory.
 */
async function runMigration(migrationFile: string) {
  console.log(`Running migration: ${migrationFile}`);

  try {
    // Read the SQL file
    const sqlPath = path.join(process.cwd(), 'supabase', 'migrations', migrationFile);

    if (!fs.existsSync(sqlPath)) {
      console.error(`Migration file not found: ${sqlPath}`);
      return;
    }

    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      console.error('Error running migration:', error);
    } else {
      console.log(`Migration ${migrationFile} executed successfully!`);
    }
  } catch (error) {
    console.error('Error running migration:', error);
  }
}

// Get the migration file from command line arguments
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('Please provide a migration file name as an argument.');
  console.error('Example: npx ts-node src/scripts/run-migration.ts 20240610_search_cache.sql');
  process.exit(1);
}

// Run the migration
runMigration(migrationFile).catch(console.error);
