'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { NotificationData } from '@/services/notification-service';
import { Bell, Check, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { formatDistanceToNow } from 'date-fns';

/**
 * Notifications Dropdown Component
 *
 * Displays a dropdown menu with user notifications
 */
export function NotificationsDropdown() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Fetch notifications when the dropdown is opened
  useEffect(() => {
    if (isOpen && user) {
      fetchNotifications();
    }
  }, [isOpen, user]);

  // Update unread count
  useEffect(() => {
    const count = notifications.filter(notification => !notification.is_read).length;
    setUnreadCount(count);
  }, [notifications]);

  // Fetch notifications from API
  const fetchNotifications = async () => {
    if (!user) {
      // If no user, set empty notifications
      setNotifications([]);
      return;
    }

    try {
      setIsLoading(true);

      // Get the Supabase token from localStorage
      let token = '';
      try {
        // Try to get the token from localStorage
        // First try the new format
        const supabaseData = localStorage.getItem('sb-olazrafayxrpqyajufle-auth-token');
        if (supabaseData) {
          const parsedData = JSON.parse(supabaseData);
          token = parsedData?.access_token || '';
        }

        // If that doesn't work, try the old format
        if (!token) {
          const session = localStorage.getItem('supabase.auth.token');
          if (session) {
            const parsedSession = JSON.parse(session);
            token = parsedSession?.currentSession?.access_token || '';
          }
        }
      } catch (error) {
        console.error('Error getting auth token:', error);
      }

      const response = await fetch('/api/notifications', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
        credentials: 'include'
      });

      if (response.status === 401) {
        // Handle authentication error silently
        console.log('Authentication required for notifications');
        setNotifications([]);
        return;
      }

      const data = await response.json();

      if (data.success) {
        setNotifications(data.notifications || []);
      } else {
        console.error('Error fetching notifications:', data.error);
        // Set empty notifications on error
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Set empty notifications on error
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Mark a notification as read
  const markAsRead = async (notificationId: string) => {
    if (!user) return;

    try {
      // Get the Supabase token from localStorage
      let token = '';
      try {
        // Try to get the token from localStorage
        // First try the new format
        const supabaseData = localStorage.getItem('sb-olazrafayxrpqyajufle-auth-token');
        if (supabaseData) {
          const parsedData = JSON.parse(supabaseData);
          token = parsedData?.access_token || '';
        }

        // If that doesn't work, try the old format
        if (!token) {
          const session = localStorage.getItem('supabase.auth.token');
          if (session) {
            const parsedSession = JSON.parse(session);
            token = parsedSession?.currentSession?.access_token || '';
          }
        }
      } catch (error) {
        console.error('Error getting auth token:', error);
      }

      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ notificationId }),
        credentials: 'include'
      });

      if (response.status === 401) {
        // Handle authentication error silently
        console.log('Authentication required for marking notification as read');
        return;
      }

      const data = await response.json();

      if (data.success) {
        // Update the notification in the state
        setNotifications(notifications.map(notification =>
          notification.id === notificationId
            ? { ...notification, is_read: true }
            : notification
        ));
      } else {
        console.error('Error marking notification as read:', data.error);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!user) return;

    try {
      // Get the Supabase token from localStorage
      let token = '';
      try {
        // Try to get the token from localStorage
        // First try the new format
        const supabaseData = localStorage.getItem('sb-olazrafayxrpqyajufle-auth-token');
        if (supabaseData) {
          const parsedData = JSON.parse(supabaseData);
          token = parsedData?.access_token || '';
        }

        // If that doesn't work, try the old format
        if (!token) {
          const session = localStorage.getItem('supabase.auth.token');
          if (session) {
            const parsedSession = JSON.parse(session);
            token = parsedSession?.currentSession?.access_token || '';
          }
        }
      } catch (error) {
        console.error('Error getting auth token:', error);
      }

      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ markAllRead: true }),
        credentials: 'include'
      });

      if (response.status === 401) {
        // Handle authentication error
        console.log('Authentication required for marking all notifications as read');
        toast({
          title: "Authentication required",
          description: "Please sign in to manage notifications",
          variant: "destructive"
        });
        return;
      }

      const data = await response.json();

      if (data.success) {
        // Update all notifications in the state
        setNotifications(notifications.map(notification => ({
          ...notification,
          is_read: true
        })));

        toast({
          title: "All notifications marked as read",
          variant: "default"
        });
      } else {
        console.error('Error marking all notifications as read:', data.error);
        toast({
          title: "Error marking notifications as read",
          description: "Please try again later",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast({
        title: "Error marking notifications as read",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };

  // Delete a notification
  const deleteNotification = async (notificationId: string) => {
    if (!user) return;

    try {
      // Get the Supabase token from localStorage
      let token = '';
      try {
        // Try to get the token from localStorage
        // First try the new format
        const supabaseData = localStorage.getItem('sb-olazrafayxrpqyajufle-auth-token');
        if (supabaseData) {
          const parsedData = JSON.parse(supabaseData);
          token = parsedData?.access_token || '';
        }

        // If that doesn't work, try the old format
        if (!token) {
          const session = localStorage.getItem('supabase.auth.token');
          if (session) {
            const parsedSession = JSON.parse(session);
            token = parsedSession?.currentSession?.access_token || '';
          }
        }
      } catch (error) {
        console.error('Error getting auth token:', error);
      }

      const response = await fetch(`/api/notifications?id=${notificationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
        credentials: 'include'
      });

      if (response.status === 401) {
        // Handle authentication error
        console.log('Authentication required for deleting notification');
        toast({
          title: "Authentication required",
          description: "Please sign in to manage notifications",
          variant: "destructive"
        });
        return;
      }

      const data = await response.json();

      if (data.success) {
        // Remove the notification from the state
        setNotifications(notifications.filter(notification =>
          notification.id !== notificationId
        ));
      } else {
        console.error('Error deleting notification:', data.error);
        toast({
          title: "Error deleting notification",
          description: "Please try again later",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: "Error deleting notification",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };

  // Handle notification click
  const handleNotificationClick = (notification: NotificationData) => {
    // Mark as read if not already read
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // Handle different notification types
    if (notification.type === 'price_alert' && notification.data?.productUrl) {
      // Open the product URL in a new tab
      window.open(notification.data.productUrl, '_blank');
    }

    // Close the dropdown
    setIsOpen(false);
  };

  // Format notification time
  const formatNotificationTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return dateString;
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {notifications.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={markAllAsRead}
            >
              <Check className="h-3 w-3 mr-1" />
              Mark all read
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {isLoading ? (
          <div className="p-4 text-center">
            <p className="text-sm text-muted-foreground">Loading notifications...</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-4 text-center">
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <>
            {notifications.map(notification => (
              <div key={notification.id} className="relative">
                <DropdownMenuItem
                  className={`p-3 cursor-pointer ${!notification.is_read ? 'bg-primary/5' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{notification.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatNotificationTime(notification.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{notification.message}</p>

                    {notification.type === 'price_alert' && notification.data && (
                      <div className="mt-1 text-xs">
                        <Badge variant="outline" className="mr-1">
                          {notification.data.platform}
                        </Badge>
                        <Badge variant="secondary">
                          {notification.data.currentPrice}
                        </Badge>
                      </div>
                    )}
                  </div>
                </DropdownMenuItem>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 absolute top-2 right-2 opacity-0 group-hover:opacity-100 hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteNotification(notification.id);
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
