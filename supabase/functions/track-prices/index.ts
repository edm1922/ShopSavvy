// Supabase Edge Function for tracking product prices
// This function runs on a schedule to update price history for tracked products

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from '../_shared/cors.ts'

// Define interfaces
interface Product {
  id: string;
  title: string;
  price: number;
  platform: string;
  productUrl: string;
}

interface PriceAlert {
  id: string;
  user_id: string;
  product_id: string;
  product_name: string;
  target_price: number;
  current_price: number;
  product_url: string;
  platform: string;
  is_active: boolean;
  is_triggered: boolean;
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to fetch product price from the appropriate scraper
async function fetchProductPrice(productId: string, platform: string, productUrl: string): Promise<number | null> {
  try {
    // Call the product API to get current price
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/get_product_price`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      },
      body: JSON.stringify({
        product_id: productId,
        platform: platform,
        product_url: productUrl
      })
    });

    if (!response.ok) {
      console.error(`Error fetching price for ${productId} on ${platform}: ${response.statusText}`);
      return null;
    }

    const data = await response.json();
    return data.price || null;
  } catch (error) {
    console.error(`Error fetching price for ${productId} on ${platform}:`, error);
    return null;
  }
}

// Function to get all active price alerts
async function getActivePriceAlerts(): Promise<PriceAlert[]> {
  try {
    const { data, error } = await supabase
      .from('price_alerts')
      .select('*')
      .eq('is_active', true)
      .eq('is_triggered', false);

    if (error) {
      console.error('Error fetching active price alerts:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching active price alerts:', error);
    return [];
  }
}

// Function to update price history for a product
async function updatePriceHistory(userId: string, product: Product): Promise<void> {
  try {
    await supabase
      .from('price_history')
      .insert({
        user_id: userId,
        product_id: product.id,
        product_name: product.title,
        price: product.price,
        platform: product.platform,
        recorded_at: new Date().toISOString()
      });
  } catch (error) {
    console.error(`Error updating price history for ${product.id}:`, error);
  }
}

// Function to create a notification
async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: string = 'price_alert',
  data: Record<string, any> = {}
): Promise<void> {
  try {
    await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        is_read: false,
        data,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
}

// Function to send an email notification
async function sendEmailNotification(
  email: string,
  subject: string,
  body: string,
  isHtml: boolean = true
): Promise<void> {
  try {
    // Get the API key from environment variables
    const apiKey = Deno.env.get('RESEND_API_KEY');

    if (!apiKey) {
      console.error('RESEND_API_KEY environment variable is not set');
      return;
    }

    // Prepare the email payload
    const payload = {
      from: 'ShopSavvy <notifications@shopsavvy.app>',
      to: email,
      subject,
      html: isHtml ? body : undefined,
      text: !isHtml ? body : undefined,
    };

    // Send the email using Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const result = await response.json();
      console.error('Error sending email:', result);
      return;
    }

    console.log('Email notification sent successfully');
  } catch (error) {
    console.error('Error sending email notification:', error);
  }
}

// Function to check and update price alerts
async function checkPriceAlerts(alert: PriceAlert, currentPrice: number): Promise<void> {
  try {
    // Check if the current price is at or below the target price
    if (currentPrice <= alert.target_price) {
      // Update the alert to triggered status
      await supabase
        .from('price_alerts')
        .update({
          is_triggered: true,
          current_price: currentPrice,
          updated_at: new Date().toISOString()
        })
        .eq('id', alert.id);

      console.log(`Price alert triggered for ${alert.product_name} - Target: ${alert.target_price}, Current: ${currentPrice}`);

      // Get user email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', alert.user_id)
        .single();

      if (userError || !userData) {
        console.error('Error getting user email:', userError);
        return;
      }

      // Create in-app notification
      const title = 'Price Drop Alert';
      const message = `The price of ${alert.product_name} has dropped to ${currentPrice}!`;
      const notificationData = {
        productId: alert.product_id,
        productUrl: alert.product_url,
        targetPrice: alert.target_price,
        currentPrice,
        platform: alert.platform
      };

      await createNotification(
        alert.user_id,
        title,
        message,
        'price_alert',
        notificationData
      );

      // Send email notification
      const emailSubject = `Price Drop Alert: ${alert.product_name}`;
      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #8b5cf6;">Price Drop Alert!</h1>
          <p>Good news! The price of a product you're tracking has dropped to your target price.</p>

          <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <h2 style="margin-top: 0; color: #111827;">${alert.product_name}</h2>
            <p style="margin-bottom: 8px;"><strong>Current Price:</strong> <span style="color: #10b981;">${currentPrice}</span></p>
            <p style="margin-bottom: 8px;"><strong>Your Target Price:</strong> ${alert.target_price}</p>
            <p style="margin-bottom: 8px;"><strong>Platform:</strong> ${alert.platform}</p>
            <a href="${alert.product_url}" style="display: inline-block; background-color: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 16px;">View Product</a>
          </div>

          <p>Don't miss out on this deal!</p>
          <p>The ShopSavvy Team</p>

          <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
            <p>You received this email because you set up a price alert on ShopSavvy.</p>
          </div>
        </div>
      `;

      await sendEmailNotification(
        userData.email,
        emailSubject,
        emailBody,
        true
      );
    } else {
      // Just update the current price
      await supabase
        .from('price_alerts')
        .update({
          current_price: currentPrice,
          updated_at: new Date().toISOString()
        })
        .eq('id', alert.id);
    }
  } catch (error) {
    console.error(`Error checking price alert for ${alert.product_id}:`, error);
  }
}

// Main function to track prices
async function trackPrices(): Promise<void> {
  try {
    // Get all active price alerts
    const alerts = await getActivePriceAlerts();
    console.log(`Found ${alerts.length} active price alerts to check`);

    // Process each alert
    for (const alert of alerts) {
      // Fetch the current price
      const currentPrice = await fetchProductPrice(
        alert.product_id,
        alert.platform,
        alert.product_url
      );

      if (currentPrice !== null) {
        // Create a product object
        const product: Product = {
          id: alert.product_id,
          title: alert.product_name,
          price: currentPrice,
          platform: alert.platform,
          productUrl: alert.product_url
        };

        // Update price history
        await updatePriceHistory(alert.user_id, product);

        // Check if alert should be triggered
        await checkPriceAlerts(alert, currentPrice);
      }
    }

    console.log('Price tracking completed successfully');
  } catch (error) {
    console.error('Error tracking prices:', error);
  }
}

// Handle HTTP requests
Deno.serve(async (req) => {
  // This enables CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Check for secret token to prevent unauthorized invocations
    const authHeader = req.headers.get('Authorization');
    const expectedToken = Deno.env.get('FUNCTION_SECRET');

    if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Run the price tracking function
    await trackPrices();

    // Return success response
    return new Response(JSON.stringify({ success: true, message: 'Price tracking completed' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    // Return error response
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
