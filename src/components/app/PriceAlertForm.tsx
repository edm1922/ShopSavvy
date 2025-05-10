'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useCurrency } from '@/contexts/currency-context';
import { Product } from '@/services/types';
import { createPriceAlert } from '@/services/price-history-service';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Bell, BellOff, Check, Info } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface PriceAlertFormProps {
  product: Product;
  onSuccess?: () => void;
}

/**
 * Price Alert Form Component
 *
 * Allows users to set up price alerts for a product
 */
export function PriceAlertForm({ product, onSuccess }: PriceAlertFormProps) {
  const { user } = useAuth();
  const { formatPrice, currencySymbol } = useCurrency();
  const { toast } = useToast();

  // Calculate a reasonable default target price (10% below current price)
  const defaultTargetPrice = Math.round(product.price * 0.9 * 100) / 100;

  const [targetPrice, setTargetPrice] = useState<number>(defaultTargetPrice);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);

  // Calculate the discount percentage
  const discountPercentage = Math.round(((product.price - targetPrice) / product.price) * 100);

  // Handle slider change
  const handleSliderChange = (value: number[]) => {
    setTargetPrice(value[0]);
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0) {
      setTargetPrice(value);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create price alerts",
        variant: "destructive"
      });

      // Redirect to login page
      window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
      return;
    }

    setIsSubmitting(true);

    try {
      // Try to create the price alert using the API endpoint instead of the service directly
      // This ensures proper authentication handling
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

        console.log('Token retrieved:', token ? 'Yes (length: ' + token.length + ')' : 'No');
      } catch (error) {
        console.error('Error getting auth token:', error);
      }

      const response = await fetch('/api/price-alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          product,
          targetPrice
        }),
        credentials: 'include'
      });

      if (response.status === 401) {
        // Handle authentication error
        toast({
          title: "Authentication required",
          description: "Please sign in to create price alerts",
          variant: "destructive"
        });

        // Redirect to login page
        window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
        return;
      }

      const data = await response.json();

      if (data.success) {
        setShowSuccess(true);
        toast({
          title: "Price alert created",
          description: `We'll notify you when the price drops to ${formatPrice(targetPrice)}`,
          variant: "default"
        });

        if (onSuccess) {
          onSuccess();
        }
      } else {
        toast({
          title: "Error creating price alert",
          description: data.error || "Please try again later",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error creating price alert:', error);
      toast({
        title: "Error creating price alert",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // If success state is shown
  if (showSuccess) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2 text-primary" />
            Price Alert Set
          </CardTitle>
          <CardDescription>
            We'll notify you when the price drops
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <Check className="h-8 w-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="font-medium">Alert created successfully!</p>
              <p className="text-sm text-muted-foreground mt-1">
                We'll notify you when the price drops to {formatPrice(targetPrice)}
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowSuccess(false)}
          >
            Set Another Alert
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center">
          <Bell className="h-5 w-5 mr-2 text-primary" />
          Set Price Alert
        </CardTitle>
        <CardDescription>
          Get notified when the price drops
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Current Price</span>
                <span className="font-medium">{formatPrice(product.price)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Target Price</span>
                <span className="font-medium text-primary">{formatPrice(targetPrice)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span>Discount</span>
                <span className={discountPercentage > 0 ? "font-medium text-green-500" : "font-medium"}>
                  {discountPercentage}%
                </span>
              </div>
            </div>

            <div className="pt-2">
              <Slider
                defaultValue={[defaultTargetPrice]}
                min={1}
                max={product.price * 1.2}
                step={1}
                value={[targetPrice]}
                onValueChange={handleSliderChange}
              />
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                  {currencySymbol}
                </div>
                <Input
                  type="number"
                  value={targetPrice}
                  onChange={handleInputChange}
                  className="pl-8"
                  min={1}
                  step={0.01}
                />
              </div>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Setting..." : "Set Alert"}
              </Button>
            </div>

            <div className="flex items-start space-x-2 text-sm text-muted-foreground">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <p>
                We'll send you a notification when the price drops to or below your target price.
              </p>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
