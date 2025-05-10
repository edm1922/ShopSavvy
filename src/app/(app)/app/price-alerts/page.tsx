'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { PriceAlert } from '@/services/types';
import { trackPageView } from '@/services/analytics';
import { useRouter } from 'next/navigation';
import { 
  Bell, 
  Trash2, 
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  Search,
  BellOff,
  Check
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useCurrency } from '@/contexts/currency-context';

export default function PriceAlertsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { formatPrice } = useCurrency();
  
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Track page view
  useEffect(() => {
    trackPageView('/app/price-alerts', 'ShopSavvy - Price Alerts');
  }, []);
  
  // Load price alerts
  useEffect(() => {
    if (user) {
      fetchAlerts();
    } else {
      setIsLoading(false);
    }
  }, [user]);
  
  // Fetch alerts from the API
  const fetchAlerts = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/price-alerts');
      const data = await response.json();
      
      if (data.success) {
        setAlerts(data.alerts);
      } else {
        toast({
          title: "Error loading alerts",
          description: data.error || "Please try again later",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching price alerts:', error);
      toast({
        title: "Error loading alerts",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle deleting an alert
  const handleDeleteAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/price-alerts?id=${alertId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Remove the alert from the state
        setAlerts(alerts.filter(alert => alert.id !== alertId));
        
        toast({
          title: "Alert deleted",
          description: "Price alert has been removed",
          variant: "default"
        });
      } else {
        toast({
          title: "Error deleting alert",
          description: data.error || "Please try again later",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting price alert:', error);
      toast({
        title: "Error deleting alert",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };
  
  // Handle toggling an alert's active state
  const handleToggleAlert = async (alertId: string, isActive: boolean) => {
    try {
      const response = await fetch('/api/price-alerts', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          alertId,
          isActive
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update the alert in the state
        setAlerts(alerts.map(alert => 
          alert.id === alertId ? { ...alert, isActive } : alert
        ));
        
        toast({
          title: isActive ? "Alert activated" : "Alert deactivated",
          description: isActive 
            ? "You'll be notified when the price drops" 
            : "You won't receive notifications for this alert",
          variant: "default"
        });
      } else {
        toast({
          title: "Error updating alert",
          description: data.error || "Please try again later",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error updating price alert:', error);
      toast({
        title: "Error updating alert",
        description: "Please try again later",
        variant: "destructive"
      });
    }
  };
  
  // Filter alerts based on search term
  const filteredAlerts = alerts.filter(alert => 
    alert.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Group alerts by status (triggered, active, inactive)
  const triggeredAlerts = filteredAlerts.filter(alert => alert.isTriggered);
  const activeAlerts = filteredAlerts.filter(alert => alert.isActive && !alert.isTriggered);
  const inactiveAlerts = filteredAlerts.filter(alert => !alert.isActive && !alert.isTriggered);
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold">Price Alerts</h1>
              <p className="text-muted-foreground">
                Get notified when prices drop
              </p>
            </div>
          </div>
          
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle>Your Price Alerts</CardTitle>
                <div className="h-6 w-6 animate-pulse bg-muted rounded-full"></div>
              </div>
              <CardDescription>
                Loading your price alerts...
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse flex items-center justify-between p-4 rounded-lg bg-muted">
                    <div className="flex items-center space-x-4">
                      <div className="h-12 w-12 bg-muted-foreground/20 rounded"></div>
                      <div className="space-y-2">
                        <div className="h-4 w-40 bg-muted-foreground/20 rounded"></div>
                        <div className="h-3 w-24 bg-muted-foreground/20 rounded"></div>
                      </div>
                    </div>
                    <div className="h-8 w-20 bg-muted-foreground/20 rounded"></div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  // Render not signed in state
  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold">Price Alerts</h1>
              <p className="text-muted-foreground">
                Get notified when prices drop
              </p>
            </div>
          </div>
          
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle>Sign In Required</CardTitle>
              <CardDescription>
                Please sign in to manage your price alerts
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-6">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-center mb-4">
                You need to be signed in to create and manage price alerts.
              </p>
              <Button onClick={() => router.push('/signin')}>
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Price Alerts</h1>
            <p className="text-muted-foreground">
              Get notified when prices drop
            </p>
          </div>
          <Button onClick={() => router.push('/app')}>
            <Search className="mr-2 h-4 w-4" />
            Find Products
          </Button>
        </div>
        
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Your Price Alerts</CardTitle>
              <Badge variant="secondary">{alerts.length}</Badge>
            </div>
            <CardDescription>
              Manage your price drop notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input
                placeholder="Search your alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            
            {filteredAlerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No price alerts yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start tracking prices by setting alerts on product pages
                </p>
                <Button onClick={() => router.push('/app')}>
                  Browse Products
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Triggered alerts */}
                {triggeredAlerts.length > 0 && (
                  <div>
                    <h3 className="font-medium flex items-center mb-3">
                      <Check className="h-4 w-4 mr-2 text-green-500" />
                      Price Drops ({triggeredAlerts.length})
                    </h3>
                    <div className="space-y-3">
                      {triggeredAlerts.map(alert => (
                        <AlertCard
                          key={alert.id}
                          alert={alert}
                          onDelete={handleDeleteAlert}
                          onToggle={handleToggleAlert}
                          formatPrice={formatPrice}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Active alerts */}
                {activeAlerts.length > 0 && (
                  <div>
                    <h3 className="font-medium flex items-center mb-3">
                      <Bell className="h-4 w-4 mr-2 text-primary" />
                      Active Alerts ({activeAlerts.length})
                    </h3>
                    <div className="space-y-3">
                      {activeAlerts.map(alert => (
                        <AlertCard
                          key={alert.id}
                          alert={alert}
                          onDelete={handleDeleteAlert}
                          onToggle={handleToggleAlert}
                          formatPrice={formatPrice}
                        />
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Inactive alerts */}
                {inactiveAlerts.length > 0 && (
                  <div>
                    <h3 className="font-medium flex items-center mb-3">
                      <BellOff className="h-4 w-4 mr-2 text-muted-foreground" />
                      Inactive Alerts ({inactiveAlerts.length})
                    </h3>
                    <div className="space-y-3">
                      {inactiveAlerts.map(alert => (
                        <AlertCard
                          key={alert.id}
                          alert={alert}
                          onDelete={handleDeleteAlert}
                          onToggle={handleToggleAlert}
                          formatPrice={formatPrice}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Alert Card Component
interface AlertCardProps {
  alert: PriceAlert;
  onDelete: (id: string) => void;
  onToggle: (id: string, isActive: boolean) => void;
  formatPrice: (price: number) => string;
}

function AlertCard({ alert, onDelete, onToggle, formatPrice }: AlertCardProps) {
  // Calculate price difference and percentage
  const priceDiff = alert.currentPrice - alert.targetPrice;
  const percentDiff = Math.round((priceDiff / alert.currentPrice) * 100);
  
  return (
    <div className={`border rounded-lg p-4 ${
      alert.isTriggered 
        ? 'border-green-500 bg-green-500/5' 
        : alert.isActive 
          ? 'border-primary/30 bg-primary/5' 
          : 'border-muted bg-muted/10'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {alert.imageUrl ? (
              <img 
                src={alert.imageUrl} 
                alt={alert.productName} 
                className="h-12 w-12 object-cover rounded-md"
              />
            ) : (
              <div className="h-12 w-12 bg-muted rounded-md flex items-center justify-center">
                <Bell className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
          </div>
          <div>
            <h4 className="font-medium line-clamp-1">{alert.productName}</h4>
            <p className="text-sm text-muted-foreground">{alert.platform}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Switch 
            checked={alert.isActive}
            onCheckedChange={(checked) => onToggle(alert.id, checked)}
            disabled={alert.isTriggered}
          />
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => onDelete(alert.id)}
          >
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>
      
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-muted-foreground">Current Price</p>
          <p className="font-medium">{formatPrice(alert.currentPrice)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Target Price</p>
          <p className="font-medium text-primary">{formatPrice(alert.targetPrice)}</p>
        </div>
      </div>
      
      <div className="mt-3 flex items-center justify-between">
        <Badge variant={alert.isTriggered ? "success" : "secondary"}>
          {alert.isTriggered 
            ? "Price dropped!" 
            : `${percentDiff}% discount when reached`}
        </Badge>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="text-xs"
          onClick={() => window.open(alert.productUrl, '_blank')}
        >
          View Product
          <ExternalLink className="h-3 w-3 ml-1" />
        </Button>
      </div>
    </div>
  );
}
