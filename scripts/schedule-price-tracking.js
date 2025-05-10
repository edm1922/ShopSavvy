/**
 * Script to trigger the price tracking Edge Function
 * 
 * This script can be run as a scheduled job (e.g., with GitHub Actions or a cron job)
 * to periodically update price history for tracked products.
 * 
 * Usage: node scripts/schedule-price-tracking.js
 */

require('dotenv').config();
const fetch = require('node-fetch');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://olazrafayxrpqyajufle.supabase.co';
const FUNCTION_SECRET = process.env.FUNCTION_SECRET || 'your-secret-token';

/**
 * Trigger the price tracking Edge Function
 */
async function triggerPriceTracking() {
  try {
    console.log('Triggering price tracking function...');
    
    // Call the Edge Function
    const response = await fetch(`${SUPABASE_URL}/functions/v1/track-prices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FUNCTION_SECRET}`
      }
    });
    
    // Check the response
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to trigger price tracking: ${response.status} ${response.statusText} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('Price tracking completed successfully:', data);
  } catch (error) {
    console.error('Error triggering price tracking:', error);
    process.exit(1);
  }
}

// Run the function
triggerPriceTracking().catch(console.error);
