/**
 * API route for notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
} from '@/services/notification-service';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://olazrafayxrpqyajufle.supabase.co';

// Use the service role key for server-side operations
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sYXpyYWZheXhycHF5YWp1ZmxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY2OTE3NywiZXhwIjoyMDYyMjQ1MTc3fQ.uobIqILTZmxJ9SS_sLZ4Y0n8dW7Y6E4BEZMxm-8SCyk';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9sYXpyYWZheXhycHF5YWp1ZmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTc0MzA0MzcsImV4cCI6MjAzMzAwNjQzN30.Yd_QlIFR-9xKVIxzP-DiDzvYJI7W1ZK5UUXpLznOlpQ';

// Use the service role key for API routes
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || serviceRoleKey;

console.log('API Route - Using Supabase URL:', supabaseUrl);
console.log('API Route - Using key type:', supabaseKey === serviceRoleKey ? 'service_role' : 'anon');

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true
  }
});

/**
 * Handles GET requests to the notifications API.
 *
 * @param request The Next.js request object.
 * @returns A promise that resolves to a Next.js response.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('GET /api/notifications - Processing request');

    // Get the user's session
    const sessionResult = await supabase.auth.getSession();
    console.log('Session result:', sessionResult.error ? 'Error' : 'Success');

    const session = sessionResult.data.session;

    // Check for authorization header as a fallback
    const authHeader = request.headers.get('Authorization');
    console.log('Authorization header present:', !!authHeader);

    let userId = session?.user?.id;
    console.log('User ID from session:', userId || 'None');

    // If no session but we have an auth header, try to get the user from the token
    if (!userId && authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      console.log('Token from Authorization header:', token ? 'Present' : 'None');

      if (token) {
        try {
          // Verify the token and get the user
          const userResult = await supabase.auth.getUser(token);
          console.log('Get user result:', userResult.error ? 'Error' : 'Success');

          if (!userResult.error && userResult.data.user) {
            userId = userResult.data.user.id;
            console.log('User ID from token:', userId);
          }
        } catch (tokenError) {
          console.error('Error verifying token:', tokenError);
        }
      }
    }

    // If still no user ID, return empty notifications instead of an error
    if (!userId) {
      console.log('No authenticated user found, returning empty notifications');
      return NextResponse.json({
        success: true,
        notifications: [],
        count: 0,
      });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;

    console.log(`Getting notifications for user ${userId} with limit ${limit} and offset ${offset}`);

    // Get the user's notifications
    const notifications = await getUserNotifications(
      userId,
      limit,
      offset
    );

    console.log(`Found ${notifications.length} notifications`);

    // Return the notifications
    return NextResponse.json({
      success: true,
      notifications,
      count: notifications.length,
    });
  } catch (error) {
    console.error('Error processing notifications request:', error);

    // Return a more detailed error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';

    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack
    });

    return NextResponse.json({
      success: false,
      error: 'Error processing notifications request: ' + errorMessage,
    }, { status: 500 });
  }
}

/**
 * Handles PATCH requests to the notifications API.
 *
 * @param request The Next.js request object.
 * @returns A promise that resolves to a Next.js response.
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('PATCH /api/notifications - Processing request');

    // Get the user's session
    const sessionResult = await supabase.auth.getSession();
    console.log('Session result:', sessionResult.error ? 'Error' : 'Success');

    const session = sessionResult.data.session;

    // Check for authorization header as a fallback
    const authHeader = request.headers.get('Authorization');
    console.log('Authorization header present:', !!authHeader);

    let userId = session?.user?.id;
    console.log('User ID from session:', userId || 'None');

    // If no session but we have an auth header, try to get the user from the token
    if (!userId && authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      console.log('Token from Authorization header:', token ? 'Present' : 'None');

      if (token) {
        try {
          // Verify the token and get the user
          const userResult = await supabase.auth.getUser(token);
          console.log('Get user result:', userResult.error ? 'Error' : 'Success');

          if (!userResult.error && userResult.data.user) {
            userId = userResult.data.user.id;
            console.log('User ID from token:', userId);
          }
        } catch (tokenError) {
          console.error('Error verifying token:', tokenError);
        }
      }
    }

    // If still no user ID, return authentication error
    if (!userId) {
      console.log('No authenticated user found, returning authentication error');
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }

    // Get the request body
    const body = await request.json();
    const { notificationId, markAllRead } = body as {
      notificationId?: string;
      markAllRead?: boolean;
    };

    console.log('Request body:', { notificationId, markAllRead });

    let success = false;

    // Mark all notifications as read
    if (markAllRead) {
      console.log(`Marking all notifications as read for user ${userId}`);
      success = await markAllNotificationsAsRead(userId);
    }
    // Mark a specific notification as read
    else if (notificationId) {
      console.log(`Marking notification ${notificationId} as read for user ${userId}`);
      success = await markNotificationAsRead(userId, notificationId);
    }
    // Invalid request
    else {
      console.log('Invalid request: Either notificationId or markAllRead is required');
      return NextResponse.json({
        success: false,
        error: 'Either notificationId or markAllRead is required',
      }, { status: 400 });
    }

    if (!success) {
      console.error('Error updating notification');
      return NextResponse.json({
        success: false,
        error: 'Error updating notification',
      }, { status: 500 });
    }

    console.log('Successfully updated notification(s)');

    // Return success
    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error processing notification update request:', error);

    // Return a more detailed error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';

    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack
    });

    return NextResponse.json({
      success: false,
      error: 'Error processing notification update request: ' + errorMessage,
    }, { status: 500 });
  }
}

/**
 * Handles DELETE requests to the notifications API.
 *
 * @param request The Next.js request object.
 * @returns A promise that resolves to a Next.js response.
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('DELETE /api/notifications - Processing request');

    // Get the user's session
    const sessionResult = await supabase.auth.getSession();
    console.log('Session result:', sessionResult.error ? 'Error' : 'Success');

    const session = sessionResult.data.session;

    // Check for authorization header as a fallback
    const authHeader = request.headers.get('Authorization');
    console.log('Authorization header present:', !!authHeader);

    let userId = session?.user?.id;
    console.log('User ID from session:', userId || 'None');

    // If no session but we have an auth header, try to get the user from the token
    if (!userId && authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      console.log('Token from Authorization header:', token ? 'Present' : 'None');

      if (token) {
        try {
          // Verify the token and get the user
          const userResult = await supabase.auth.getUser(token);
          console.log('Get user result:', userResult.error ? 'Error' : 'Success');

          if (!userResult.error && userResult.data.user) {
            userId = userResult.data.user.id;
            console.log('User ID from token:', userId);
          }
        } catch (tokenError) {
          console.error('Error verifying token:', tokenError);
        }
      }
    }

    // If still no user ID, return authentication error
    if (!userId) {
      console.log('No authenticated user found, returning authentication error');
      return NextResponse.json({
        success: false,
        error: 'Authentication required',
      }, { status: 401 });
    }

    // Get the notification ID from the URL
    const searchParams = request.nextUrl.searchParams;
    const notificationId = searchParams.get('id');
    console.log('Notification ID from URL:', notificationId || 'None');

    // Validate the parameters
    if (!notificationId) {
      console.log('Invalid request: Notification ID is required');
      return NextResponse.json({
        success: false,
        error: 'Notification ID is required',
      }, { status: 400 });
    }

    console.log(`Deleting notification ${notificationId} for user ${userId}`);

    // Delete the notification
    const success = await deleteNotification(
      userId,
      notificationId
    );

    if (!success) {
      console.error('Error deleting notification');
      return NextResponse.json({
        success: false,
        error: 'Error deleting notification',
      }, { status: 500 });
    }

    console.log('Successfully deleted notification');

    // Return success
    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error processing notification deletion request:', error);

    // Return a more detailed error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';

    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack
    });

    return NextResponse.json({
      success: false,
      error: 'Error processing notification deletion request: ' + errorMessage,
    }, { status: 500 });
  }
}
