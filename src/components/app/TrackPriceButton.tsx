'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Product } from '@/services/types';
import { Button } from '@/components/ui/button';
import { LineChart, TrendingDown } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PriceAlertForm } from './PriceAlertForm';

interface TrackPriceButtonProps {
  product: Product;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

/**
 * Track Price Button Component
 *
 * Button that allows users to track a product's price and set up price alerts
 */
export function TrackPriceButton({
  product,
  variant = 'outline',
  size = 'sm',
  className = ''
}: TrackPriceButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isTracking, setIsTracking] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Handle tracking a product's price
  const handleTrackPrice = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to track product prices",
        variant: "destructive"
      });

      // Open the dialog to show the price alert form anyway
      // This will allow the user to see what they're missing
      setIsDialogOpen(true);
      return;
    }

    setIsTracking(true);

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

        console.log('Token retrieved:', token ? 'Yes (length: ' + token.length + ')' : 'No');
      } catch (error) {
        console.error('Error getting auth token:', error);
      }

      const response = await fetch('/api/price-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ product }),
        credentials: 'include'
      });

      if (response.status === 401) {
        // Handle authentication error
        toast({
          title: "Authentication required",
          description: "Please sign in to track product prices",
          variant: "destructive"
        });

        // Open the dialog anyway to show what they're missing
        setIsDialogOpen(true);
        return;
      }

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Price tracking started",
          description: "We'll start tracking this product's price history",
          variant: "default"
        });

        // Open the dialog to set up a price alert
        setIsDialogOpen(true);
      } else {
        toast({
          title: "Error tracking price",
          description: data.error || "Please try again later",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error tracking product price:', error);
      toast({
        title: "Error tracking price",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsTracking(false);
    }
  };

  // Handle dialog close
  const handleDialogClose = () => {
    setIsDialogOpen(false);
  };

  // Render different content based on authentication status
  const renderDialogContent = () => {
    if (!user) {
      return (
        <>
          <DialogHeader>
            <DialogTitle>Sign in Required</DialogTitle>
            <DialogDescription>
              Please sign in to track prices and set up alerts
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="text-center p-4">
              <p className="mb-4">
                Sign in to ShopSavvy to track prices and receive alerts when prices drop.
              </p>
              <div className="flex justify-center gap-4">
                <Button asChild>
                  <a href="/login">Sign In</a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="/register">Sign Up</a>
                </Button>
              </div>
            </div>
          </div>
        </>
      );
    }

    return (
      <>
        <DialogHeader>
          <DialogTitle>Track Price</DialogTitle>
          <DialogDescription>
            Set up price alerts for {product.title}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <PriceAlertForm
            product={product}
            onSuccess={handleDialogClose}
          />
        </div>
      </>
    );
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleTrackPrice();
          }}
          disabled={isTracking}
        >
          {isTracking ? (
            <>Tracking...</>
          ) : (
            <>
              <LineChart className="h-4 w-4 mr-1" />
              Track Price
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        {renderDialogContent()}
      </DialogContent>
    </Dialog>
  );
}
