'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useCurrency } from '@/contexts/currency-context';
import { ProductDetails, PriceHistory } from '@/services/types';
import { trackPageView, trackProductView } from '@/services/analytics';
import {
  ArrowLeft,
  ExternalLink,
  Heart,
  Share2,
  Star,
  StarHalf,
  Info,
  ShoppingBag,
  LineChart,
  Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PriceHistoryChart } from '@/components/app/PriceHistoryChart';
import { PriceAlertForm } from '@/components/app/PriceAlertForm';
import { TrackPriceButton } from '@/components/app/TrackPriceButton';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useToast } from '@/components/ui/use-toast';

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const { toast } = useToast();
  
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [priceHistory, setPriceHistory] = useState<PriceHistory | null>(null);
  const [isLoadingPriceHistory, setIsLoadingPriceHistory] = useState<boolean>(false);
  const [isWishlisted, setIsWishlisted] = useState<boolean>(false);
  
  // Extract product ID and platform from URL
  const productId = params.id as string;
  const platform = new URLSearchParams(window.location.search).get('platform') || '';
  
  // Track page view
  useEffect(() => {
    if (productId && platform) {
      trackPageView(`/app/product/${productId}?platform=${platform}`, 'ShopSavvy - Product Details');
    }
  }, [productId, platform]);
  
  // Fetch product details
  useEffect(() => {
    if (productId && platform) {
      fetchProductDetails();
    }
  }, [productId, platform]);
  
  // Fetch price history when user is authenticated
  useEffect(() => {
    if (user && product) {
      fetchPriceHistory();
    }
  }, [user, product]);
  
  // Fetch product details from API
  const fetchProductDetails = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/product?id=${productId}&platform=${platform}`);
      const data = await response.json();
      
      if (data.success && data.product) {
        setProduct(data.product);
        
        // Track product view
        trackProductView(
          data.product.id,
          data.product.title,
          data.product.platform,
          data.product.price
        );
      } else {
        toast({
          title: "Error loading product",
          description: data.error || "Product not found",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching product details:', error);
      toast({
        title: "Error loading product",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch price history from API
  const fetchPriceHistory = async () => {
    if (!user || !product) return;
    
    try {
      setIsLoadingPriceHistory(true);
      
      const response = await fetch(`/api/price-history?productId=${product.id}`);
      const data = await response.json();
      
      if (data.success) {
        setPriceHistory(data.priceHistory);
      }
    } catch (error) {
      console.error('Error fetching price history:', error);
    } finally {
      setIsLoadingPriceHistory(false);
    }
  };
  
  // Handle adding to wishlist
  const handleToggleWishlist = () => {
    setIsWishlisted(!isWishlisted);
    
    toast({
      title: isWishlisted ? "Removed from wishlist" : "Added to wishlist",
      description: isWishlisted 
        ? "Product has been removed from your wishlist" 
        : "Product has been added to your wishlist",
      variant: "default"
    });
  };
  
  // Handle sharing product
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.title || 'Check out this product',
        url: window.location.href
      }).catch(err => console.error('Error sharing:', err));
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "Product link copied to clipboard",
        variant: "default"
      });
    }
  };
  
  // Generate star rating display (1-5 stars)
  const renderRating = (rating: number) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const stars = [];

    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={`star-${i}`} className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
    }

    // Add half star if needed
    if (hasHalfStar) {
      stars.push(<StarHalf key="half-star" className="h-4 w-4 fill-yellow-400 text-yellow-400" />);
    }

    // Add empty stars to make 5 total
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-star-${i}`} className="h-4 w-4 text-gray-300" />);
    }

    return stars;
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="flex items-center space-x-4">
              <div className="h-10 w-10 rounded-full bg-muted"></div>
              <div className="h-6 w-40 bg-muted rounded"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="aspect-square bg-muted rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 w-3/4 bg-muted rounded"></div>
                <div className="h-6 w-1/2 bg-muted rounded"></div>
                <div className="h-4 w-1/4 bg-muted rounded"></div>
                <div className="h-24 w-full bg-muted rounded"></div>
                <div className="h-10 w-full bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Render product not found
  if (!product) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Product Not Found</h1>
          <p className="text-muted-foreground mb-6">
            The product you're looking for could not be found.
          </p>
          <Button onClick={() => router.push('/app')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Search
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back button */}
        <Button 
          variant="ghost" 
          className="mb-6"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        {/* Product details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Product image */}
          <div className="bg-muted rounded-lg overflow-hidden">
            <img 
              src={product.imageUrl || '/images/product-placeholder.svg'} 
              alt={product.title}
              className="w-full h-full object-contain aspect-square"
              onError={(e) => {
                e.currentTarget.src = '/images/product-placeholder.svg';
              }}
            />
          </div>
          
          {/* Product info */}
          <div className="space-y-4">
            {/* Platform badge */}
            <Badge variant="outline" className="mb-2">
              {product.platform}
            </Badge>
            
            {/* Product title */}
            <h1 className="text-3xl font-bold">{product.title}</h1>
            
            {/* Rating */}
            {product.rating && (
              <div className="flex items-center">
                <div className="flex mr-2">
                  {renderRating(product.rating)}
                </div>
                <span className="text-sm text-muted-foreground">
                  ({product.ratingCount || 0} reviews)
                </span>
              </div>
            )}
            
            {/* Price */}
            <div className="mt-4">
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-primary">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="ml-2 text-lg text-muted-foreground line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>
              
              {product.originalPrice && product.originalPrice > product.price && (
                <div className="mt-1">
                  <Badge variant="destructive">
                    {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                  </Badge>
                </div>
              )}
            </div>
            
            {/* Description */}
            {product.description && (
              <div className="mt-4">
                <h2 className="text-lg font-semibold mb-2">Description</h2>
                <p className="text-muted-foreground">
                  {product.description}
                </p>
              </div>
            )}
            
            {/* Action buttons */}
            <div className="flex flex-col space-y-3 mt-6">
              <Button asChild size="lg">
                <a href={product.productUrl} target="_blank" rel="noopener noreferrer">
                  <ShoppingBag className="mr-2 h-5 w-5" />
                  View on {product.platform}
                  <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
              
              <div className="grid grid-cols-2 gap-3">
                <TrackPriceButton 
                  product={product}
                  variant="outline"
                  size="default"
                  className="w-full"
                />
                
                <Button 
                  variant="outline" 
                  onClick={handleToggleWishlist}
                >
                  <Heart className={`mr-2 h-5 w-5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                  {isWishlisted ? 'Saved' : 'Save'}
                </Button>
              </div>
              
              <Button 
                variant="ghost" 
                onClick={handleShare}
              >
                <Share2 className="mr-2 h-5 w-5" />
                Share
              </Button>
            </div>
          </div>
        </div>
        
        {/* Tabs for additional information */}
        <div className="mt-12">
          <Tabs defaultValue="price-history">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="price-history">
                <LineChart className="h-4 w-4 mr-2" />
                Price History
              </TabsTrigger>
              <TabsTrigger value="price-alerts">
                <Bell className="h-4 w-4 mr-2" />
                Price Alerts
              </TabsTrigger>
              <TabsTrigger value="details">
                <Info className="h-4 w-4 mr-2" />
                Details
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="price-history" className="mt-6">
              <ErrorBoundary>
                <PriceHistoryChart 
                  priceHistory={priceHistory} 
                  isLoading={isLoadingPriceHistory}
                />
              </ErrorBoundary>
            </TabsContent>
            
            <TabsContent value="price-alerts" className="mt-6">
              <ErrorBoundary>
                <PriceAlertForm product={product} />
              </ErrorBoundary>
            </TabsContent>
            
            <TabsContent value="details" className="mt-6">
              <div className="space-y-4">
                {/* Specifications */}
                {product.specifications && Object.keys(product.specifications).length > 0 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">Specifications</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(product.specifications).map(([key, value]) => (
                        <div key={key} className="flex justify-between border-b pb-2">
                          <span className="font-medium">{key}</span>
                          <span className="text-muted-foreground">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Brand info */}
                {product.brand && (
                  <div className="mt-6">
                    <h2 className="text-xl font-semibold mb-4">Brand</h2>
                    <p>{product.brand}</p>
                  </div>
                )}
                
                {/* Category */}
                {product.category && (
                  <div className="mt-6">
                    <h2 className="text-xl font-semibold mb-4">Category</h2>
                    <p>{product.category}</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
