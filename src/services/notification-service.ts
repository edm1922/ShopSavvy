/**
 * Notification Service
 * 
 * This service handles sending notifications to users for price alerts and other events.
 */

import { createClient } from '@supabase/supabase-js';
import { PriceAlert } from './types';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://olazrafayxrpqyajufle.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sYXpyYWZheXhycHF5YWp1ZmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTc0MzA0MzcsImV4cCI6MjAzMzAwNjQzN30.Yd_QlIFR-9xKVIxzP-DiDzvYJI7W1ZK5UUXpLznOlpQ';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Interface for notification data
 */
export interface NotificationData {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'price_alert' | 'system' | 'info';
  is_read: boolean;
  data?: Record<string, any>;
  created_at: string;
}

/**
 * Create a notification for a user
 * 
 * @param userId User ID
 * @param title Notification title
 * @param message Notification message
 * @param type Notification type
 * @param data Additional data
 * @returns True if successful, false otherwise
 */
export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: 'price_alert' | 'system' | 'info' = 'info',
  data?: Record<string, any>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        data,
        is_read: false,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error creating notification:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error creating notification:', error);
    return false;
  }
}

/**
 * Create a price alert notification
 * 
 * @param userId User ID
 * @param alert Price alert data
 * @returns True if successful, false otherwise
 */
export async function createPriceAlertNotification(
  userId: string,
  alert: PriceAlert
): Promise<boolean> {
  const title = 'Price Drop Alert';
  const message = `The price of ${alert.productName} has dropped to ${alert.currentPrice}!`;
  const data = {
    productId: alert.productId,
    productUrl: alert.productUrl,
    targetPrice: alert.targetPrice,
    currentPrice: alert.currentPrice,
    platform: alert.platform
  };

  return createNotification(userId, title, message, 'price_alert', data);
}

/**
 * Get notifications for a user
 * 
 * @param userId User ID
 * @param limit Maximum number of notifications to return
 * @param offset Offset for pagination
 * @returns Array of notifications
 */
export async function getUserNotifications(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<NotificationData[]> {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error getting user notifications:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting user notifications:', error);
    return [];
  }
}

/**
 * Mark a notification as read
 * 
 * @param userId User ID
 * @param notificationId Notification ID
 * @returns True if successful, false otherwise
 */
export async function markNotificationAsRead(
  userId: string,
  notificationId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
}

/**
 * Mark all notifications as read for a user
 * 
 * @param userId User ID
 * @returns True if successful, false otherwise
 */
export async function markAllNotificationsAsRead(
  userId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
}

/**
 * Delete a notification
 * 
 * @param userId User ID
 * @param notificationId Notification ID
 * @returns True if successful, false otherwise
 */
export async function deleteNotification(
  userId: string,
  notificationId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting notification:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting notification:', error);
    return false;
  }
}
