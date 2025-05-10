/**
 * Price History Service
 *
 * This service handles tracking and retrieving price history for products.
 */

import { createClient } from '@supabase/supabase-js';
import { PriceHistory, PriceHistoryPoint, PriceAlert, Product } from './types';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://olazrafayxrpqyajufle.supabase.co';

// Use the service role key for server-side operations
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sYXpyYWZheXhycHF5YWp1ZmxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY2OTE3NywiZXhwIjoyMDYyMjQ1MTc3fQ.uobIqILTZmxJ9SS_sLZ4Y0n8dW7Y6E4BEZMxm-8SCyk';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sYXpyYWZheXhycHF5YWp1ZmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTc0MzA0MzcsImV4cCI6MjAzMzAwNjQzN30.Yd_QlIFR-9xKVIxzP-DiDzvYJI7W1ZK5UUXpLznOlpQ';

// Determine if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Use the appropriate key based on environment
const supabaseKey = isBrowser
  ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || anonKey
  : process.env.SUPABASE_SERVICE_ROLE_KEY || serviceRoleKey;

console.log('Price History Service - Using Supabase URL:', supabaseUrl);
console.log('Price History Service - In browser environment:', isBrowser);
console.log('Price History Service - Using key type:', isBrowser ? 'anon' : 'service_role');

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
});

/**
 * Track a product's price
 *
 * @param userId User ID
 * @param product Product to track
 * @returns True if successful, false otherwise
 */
export async function trackProductPrice(
  userId: string,
  product: Product
): Promise<boolean> {
  try {
    console.log('trackProductPrice - Starting with userId:', userId);
    console.log('trackProductPrice - Product:', {
      id: product.id,
      title: product.title,
      price: product.price,
      platform: product.platform
    });

    // Create the record to insert
    const priceRecord = {
      user_id: userId,
      product_id: product.id,
      product_name: product.title,
      price: product.price,
      platform: product.platform,
      recorded_at: new Date().toISOString()
    };

    console.log('trackProductPrice - Inserting record:', priceRecord);

    const { data, error } = await supabase
      .from('price_history')
      .insert(priceRecord)
      .select();

    if (error) {
      console.error('Error tracking product price:', error);

      // If the error is related to the user_id foreign key constraint
      // and we're using a guest user, we can create a profile for the guest user
      if (userId === 'guest-user' && error.message.includes('foreign key constraint')) {
        console.log('Creating guest user profile');

        // Create a profile for the guest user
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: 'guest-user',
            full_name: 'Guest User',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (profileError) {
          console.error('Error creating guest profile:', profileError);
          return false;
        }

        // Try inserting the price record again
        console.log('Retrying price history insert after creating guest profile');
        const { error: retryError } = await supabase
          .from('price_history')
          .insert(priceRecord);

        if (retryError) {
          console.error('Error tracking product price after retry:', retryError);
          return false;
        }

        return true;
      }

      return false;
    }

    console.log('trackProductPrice - Success:', data);
    return true;
  } catch (error) {
    console.error('Error tracking product price:', error);
    return false;
  }
}

/**
 * Get price history for a product
 *
 * @param userId User ID
 * @param productId Product ID
 * @param days Number of days to look back (default: 30)
 * @returns Price history data
 */
export async function getProductPriceHistory(
  userId: string,
  productId: string,
  days: number = 30
): Promise<PriceHistory | null> {
  try {
    // Calculate the date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Query the price history
    const { data, error } = await supabase
      .from('price_history')
      .select('*')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .gte('recorded_at', startDate.toISOString())
      .lte('recorded_at', endDate.toISOString())
      .order('recorded_at', { ascending: true });

    if (error) {
      console.error('Error getting product price history:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    // Transform the data
    const pricePoints: PriceHistoryPoint[] = data.map(item => ({
      price: parseFloat(item.price),
      date: item.recorded_at,
      platform: item.platform
    }));

    // Calculate statistics
    const prices = pricePoints.map(point => point.price);
    const currentPrice = prices[prices.length - 1];
    const lowestPrice = Math.min(...prices);
    const highestPrice = Math.max(...prices);
    const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;

    // Calculate price change (from first to last)
    const firstPrice = prices[0];
    const priceChange = firstPrice !== 0
      ? ((currentPrice - firstPrice) / firstPrice) * 100
      : 0;

    // Determine price change direction
    let priceChangeDirection: 'up' | 'down' | 'stable' = 'stable';
    if (priceChange > 1) {
      priceChangeDirection = 'up';
    } else if (priceChange < -1) {
      priceChangeDirection = 'down';
    }

    return {
      productId,
      productName: data[0].product_name,
      currentPrice,
      lowestPrice,
      highestPrice,
      pricePoints,
      averagePrice,
      priceChange,
      priceChangeDirection
    };
  } catch (error) {
    console.error('Error getting product price history:', error);
    return null;
  }
}

/**
 * Create a price alert for a product
 *
 * @param userId User ID
 * @param product Product to create alert for
 * @param targetPrice Target price
 * @returns True if successful, false otherwise
 */
export async function createPriceAlert(
  userId: string,
  product: Product,
  targetPrice: number
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('price_alerts')
      .insert({
        user_id: userId,
        product_id: product.id,
        product_name: product.title,
        target_price: targetPrice,
        current_price: product.price,
        product_url: product.productUrl,
        platform: product.platform,
        is_active: true,
        is_triggered: false
      });

    if (error) {
      console.error('Error creating price alert:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error creating price alert:', error);
    return false;
  }
}

/**
 * Get all price alerts for a user
 *
 * @param userId User ID
 * @returns Array of price alerts
 */
export async function getUserPriceAlerts(userId: string): Promise<PriceAlert[]> {
  try {
    const { data, error } = await supabase
      .from('price_alerts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting user price alerts:', error);
      return [];
    }

    return data.map(alert => ({
      id: alert.id,
      productId: alert.product_id,
      productName: alert.product_name,
      productUrl: alert.product_url,
      imageUrl: alert.image_url,
      currentPrice: parseFloat(alert.current_price),
      targetPrice: parseFloat(alert.target_price),
      platform: alert.platform,
      isActive: alert.is_active,
      isTriggered: alert.is_triggered,
      createdAt: alert.created_at,
      updatedAt: alert.updated_at
    }));
  } catch (error) {
    console.error('Error getting user price alerts:', error);
    return [];
  }
}

/**
 * Delete a price alert
 *
 * @param userId User ID
 * @param alertId Alert ID
 * @returns True if successful, false otherwise
 */
export async function deletePriceAlert(
  userId: string,
  alertId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('price_alerts')
      .delete()
      .eq('id', alertId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting price alert:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting price alert:', error);
    return false;
  }
}

/**
 * Update a price alert
 *
 * @param userId User ID
 * @param alertId Alert ID
 * @param updates Updates to apply
 * @returns True if successful, false otherwise
 */
export async function updatePriceAlert(
  userId: string,
  alertId: string,
  updates: Partial<{
    targetPrice: number;
    isActive: boolean;
  }>
): Promise<boolean> {
  try {
    const updateData: any = {};

    if (updates.targetPrice !== undefined) {
      updateData.target_price = updates.targetPrice;
    }

    if (updates.isActive !== undefined) {
      updateData.is_active = updates.isActive;
    }

    // Add updated_at timestamp
    updateData.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from('price_alerts')
      .update(updateData)
      .eq('id', alertId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating price alert:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating price alert:', error);
    return false;
  }
}
