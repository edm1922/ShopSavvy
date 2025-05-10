'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Bell, Mail, Clock, AlertTriangle } from 'lucide-react';

/**
 * Interface for email preferences
 */
interface EmailPreferences {
  priceAlerts: boolean;
  weeklyDigest: boolean;
  specialOffers: boolean;
  accountNotifications: boolean;
}

/**
 * Email Preferences Component
 * 
 * Allows users to manage their email notification preferences
 */
export function EmailPreferences() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [preferences, setPreferences] = useState<EmailPreferences>({
    priceAlerts: true,
    weeklyDigest: true,
    specialOffers: false,
    accountNotifications: true
  });
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  
  // Load preferences when component mounts
  useEffect(() => {
    if (user) {
      loadPreferences();
    } else {
      setIsLoading(false);
    }
  }, [user]);
  
  // Load preferences from database
  const loadPreferences = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/user/email-preferences');
      const data = await response.json();
      
      if (data.success) {
        setPreferences(data.preferences);
      } else {
        console.error('Error loading email preferences:', data.error);
      }
    } catch (error) {
      console.error('Error loading email preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Save preferences to database
  const savePreferences = async () => {
    if (!user) return;
    
    try {
      setIsSaving(true);
      
      const response = await fetch('/api/user/email-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ preferences })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Preferences saved",
          description: "Your email preferences have been updated",
          variant: "default"
        });
      } else {
        toast({
          title: "Error saving preferences",
          description: data.error || "Please try again later",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error saving email preferences:', error);
      toast({
        title: "Error saving preferences",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle preference change
  const handlePreferenceChange = (key: keyof EmailPreferences, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Email Preferences</CardTitle>
          <CardDescription>Manage your email notification settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="h-4 w-40 bg-muted rounded animate-pulse"></div>
                <div className="h-3 w-60 bg-muted rounded animate-pulse mt-1"></div>
              </div>
              <div className="h-6 w-10 bg-muted rounded animate-pulse"></div>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="h-4 w-40 bg-muted rounded animate-pulse"></div>
                <div className="h-3 w-60 bg-muted rounded animate-pulse mt-1"></div>
              </div>
              <div className="h-6 w-10 bg-muted rounded animate-pulse"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Mail className="h-5 w-5 mr-2 text-primary" />
          Email Preferences
        </CardTitle>
        <CardDescription>
          Manage your email notification settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base flex items-center">
                <Bell className="h-4 w-4 mr-2 text-primary" />
                Price Alert Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive emails when prices drop to your target price
              </p>
            </div>
            <Switch
              checked={preferences.priceAlerts}
              onCheckedChange={(checked) => handlePreferenceChange('priceAlerts', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base flex items-center">
                <Clock className="h-4 w-4 mr-2 text-primary" />
                Weekly Price Digest
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive a weekly summary of your tracked products
              </p>
            </div>
            <Switch
              checked={preferences.weeklyDigest}
              onCheckedChange={(checked) => handlePreferenceChange('weeklyDigest', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2 text-primary" />
                Special Offers & Promotions
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive emails about special deals and promotions
              </p>
            </div>
            <Switch
              checked={preferences.specialOffers}
              onCheckedChange={(checked) => handlePreferenceChange('specialOffers', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base flex items-center">
                <Mail className="h-4 w-4 mr-2 text-primary" />
                Account Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive emails about your account activity
              </p>
            </div>
            <Switch
              checked={preferences.accountNotifications}
              onCheckedChange={(checked) => handlePreferenceChange('accountNotifications', checked)}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={savePreferences} 
          disabled={isSaving}
          className="ml-auto"
        >
          {isSaving ? "Saving..." : "Save Preferences"}
        </Button>
      </CardFooter>
    </Card>
  );
}
