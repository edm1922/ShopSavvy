/**
 * Email Service
 * 
 * This service handles sending emails to users.
 * It uses Supabase Edge Functions to send emails via a third-party email service.
 */

import { createClient } from '@supabase/supabase-js';
import { PriceAlert } from './types';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://olazrafayxrpqyajufle.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sYXpyYWZheXhycHF5YWp1ZmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTc0MzA0MzcsImV4cCI6MjAzMzAwNjQzN30.Yd_QlIFR-9xKVIxzP-DiDzvYJI7W1ZK5UUXpLznOlpQ';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Interface for email data
 */
export interface EmailData {
  to: string;
  subject: string;
  body: string;
  isHtml?: boolean;
}

/**
 * Send an email
 * 
 * @param emailData Email data
 * @returns True if successful, false otherwise
 */
export async function sendEmail(emailData: EmailData): Promise<boolean> {
  try {
    // Call the send-email Edge Function
    const { data, error } = await supabase.functions.invoke('send-email', {
      body: emailData
    });

    if (error) {
      console.error('Error sending email:', error);
      return false;
    }

    return data?.success || false;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send a welcome email to a new user
 * 
 * @param email User's email address
 * @param name User's name
 * @returns True if successful, false otherwise
 */
export async function sendWelcomeEmail(email: string, name: string): Promise<boolean> {
  const subject = 'Welcome to ShopSavvy!';
  const body = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #8b5cf6;">Welcome to ShopSavvy!</h1>
      <p>Hello ${name || 'there'},</p>
      <p>Thank you for joining ShopSavvy, your smart shopping companion!</p>
      <p>With ShopSavvy, you can:</p>
      <ul>
        <li>Compare prices across multiple platforms</li>
        <li>Track price history</li>
        <li>Set price alerts</li>
        <li>Get personalized recommendations</li>
      </ul>
      <p>Get started by searching for products or setting up your first price alert.</p>
      <p>Happy shopping!</p>
      <p>The ShopSavvy Team</p>
    </div>
  `;

  return sendEmail({
    to: email,
    subject,
    body,
    isHtml: true
  });
}

/**
 * Send a price alert email
 * 
 * @param email User's email address
 * @param alert Price alert data
 * @returns True if successful, false otherwise
 */
export async function sendPriceAlertEmail(email: string, alert: PriceAlert): Promise<boolean> {
  const subject = `Price Drop Alert: ${alert.productName}`;
  const body = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #8b5cf6;">Price Drop Alert!</h1>
      <p>Good news! The price of a product you're tracking has dropped to your target price.</p>
      
      <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 24px 0;">
        <h2 style="margin-top: 0; color: #111827;">${alert.productName}</h2>
        <p style="margin-bottom: 8px;"><strong>Current Price:</strong> <span style="color: #10b981;">${alert.currentPrice}</span></p>
        <p style="margin-bottom: 8px;"><strong>Your Target Price:</strong> ${alert.targetPrice}</p>
        <p style="margin-bottom: 8px;"><strong>Platform:</strong> ${alert.platform}</p>
        <a href="${alert.productUrl}" style="display: inline-block; background-color: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 16px;">View Product</a>
      </div>
      
      <p>Don't miss out on this deal!</p>
      <p>The ShopSavvy Team</p>
      
      <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
        <p>You received this email because you set up a price alert on ShopSavvy. To manage your alerts, visit your <a href="${supabaseUrl}/app/price-alerts" style="color: #8b5cf6;">Price Alerts</a> page.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject,
    body,
    isHtml: true
  });
}

/**
 * Send a weekly price digest email
 * 
 * @param email User's email address
 * @param name User's name
 * @param alerts Price alerts data
 * @returns True if successful, false otherwise
 */
export async function sendWeeklyPriceDigest(
  email: string,
  name: string,
  alerts: PriceAlert[]
): Promise<boolean> {
  const subject = 'Your Weekly Price Digest from ShopSavvy';
  
  // Generate HTML for each alert
  const alertsHtml = alerts.map(alert => `
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
      <h3 style="margin-top: 0; color: #111827;">${alert.productName}</h3>
      <p style="margin-bottom: 8px;"><strong>Current Price:</strong> ${alert.currentPrice}</p>
      <p style="margin-bottom: 8px;"><strong>Your Target Price:</strong> ${alert.targetPrice}</p>
      <p style="margin-bottom: 8px;"><strong>Platform:</strong> ${alert.platform}</p>
      <a href="${alert.productUrl}" style="display: inline-block; background-color: #8b5cf6; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; margin-top: 8px;">View Product</a>
    </div>
  `).join('');
  
  const body = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #8b5cf6;">Your Weekly Price Digest</h1>
      <p>Hello ${name || 'there'},</p>
      <p>Here's an update on the products you're tracking:</p>
      
      ${alertsHtml}
      
      <p>Visit ShopSavvy to manage your price alerts and discover more deals!</p>
      <p>Happy shopping!</p>
      <p>The ShopSavvy Team</p>
      
      <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
        <p>You received this email because you have active price alerts on ShopSavvy. To manage your email preferences, visit your <a href="${supabaseUrl}/app/settings" style="color: #8b5cf6;">Settings</a> page.</p>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject,
    body,
    isHtml: true
  });
}
