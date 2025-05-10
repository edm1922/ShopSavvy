// src/components/app/ProductCard.tsx
import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/services/shopping-apis';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ExternalLink,
  ImageOff,
  Star,
  StarHalf,
  Heart,
  Flame,
  Award,
  TrendingUp
} from 'lucide-react';
import { useCurrency } from '@/contexts/currency-context';

interface ProductCardProps {
  product: Product & {
    // Additional properties used in the component
    brand?: string;
    isNew?: boolean;
    isBestseller?: boolean;
    isTrending?: boolean;
    reviewCount?: number;
  };
}

/**
 * Validates and cleans an image URL.
 * Enhanced to better handle various image URL formats and CDN patterns.
 * Also removes size constraints to get full-size images.
 * Handles DeepSeek validation markers.
 *
 * @param url The image URL to validate.
 * @returns The cleaned URL or null if invalid.
 */
function validateImageUrl(url: string | undefined): string | null {
  if (!url) return null;

  // Handle DeepSeek validation markers
  if (url.startsWith('VALIDATE_WITH_DEEPSEEK:')) {
    // Extract the actual URL from the marker
    const parts = url.split(':');
    if (parts.length > 1) {
      url = parts[1]; // Use the actual URL
    }
  }

  // Clean the URL - remove whitespace and any quotes
  const cleanedUrl = url.trim().replace(/['"]/g, '');
  if (!cleanedUrl) return null;

  // Process the URL based on the domain
  let processedUrl = cleanedUrl;

  // Handle Lazada CDN domains with special parameters
  if (processedUrl.includes('lzd-img-global.slatic.net') ||
      processedUrl.includes('ph-live.slatic.net') ||
      processedUrl.includes('my-live-02.slatic.net') ||
      processedUrl.includes('sg-live.slatic.net')) {

    // Remove size constraints from URLs (like _80x80q80, _120x120q80, etc.)
    processedUrl = processedUrl.replace(/_([\d]+x[\d]+q[\d]+)(\.jpg|\.png|\.webp)/, '$2');

    // Also handle other size formats
    processedUrl = processedUrl.replace(/_([\d]+x[\d]+)(\.jpg|\.png|\.webp)/, '$2');

    // Handle Lazada's tps/imgextra format which often contains promotional images
    if (processedUrl.includes('/tps/imgextra/')) {
      // Check if it's a small icon (often promotional)
      if (processedUrl.includes('-tps-60-60.') ||
          processedUrl.includes('-tps-40-40.') ||
          processedUrl.includes('-tps-20-20.')) {
        // This is likely a promotional icon, not a product image
        return null;
      }
    }
  }

  // Handle Zalora image URLs
  if (processedUrl.includes('zalora.com.ph')) {
    // Ensure we're getting the largest image size
    processedUrl = processedUrl.replace(/\?.*$/, ''); // Remove query parameters
  }

  // Handle Shein image URLs
  if (processedUrl.includes('img.ltwebstatic.com')) {
    // Ensure we're getting the largest image size
    processedUrl = processedUrl.replace(/_thumbnail\d+x\d+/, '');
  }

  // Check if the URL is valid
  try {
    new URL(processedUrl);
  } catch (e) {
    // If the URL is relative, it might be valid
    if (!processedUrl.startsWith('http') && !processedUrl.startsWith('/')) {
      return null;
    }
  }

  // Check if the URL points to an image
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif'];
  const hasImageExtension = imageExtensions.some(ext => processedUrl.toLowerCase().includes(ext));

  // Check for common CDN patterns that indicate an image
  const cdnPatterns = [
    'lzd-img-global.slatic.net',
    'ph-live.slatic.net',
    'my-live-02.slatic.net',
    'sg-live.slatic.net',
    'th-live.slatic.net',
    'id-live.slatic.net',
    'vn-live.slatic.net',
    'lazcdn.com',
    'zalora.com.ph/catalog',
    'zalora.com.ph/images',
    'zalora.com.ph/assets',
    'shein.com/images',
    'shein.com/assets',
    'img.ltwebstatic.com',
    'cdn.shopify.com',
    'images.unsplash.com',
    'cloudfront.net',
    'cloudinary.com',
    'imgix.net'
  ];

  const isCdnImage = cdnPatterns.some(pattern => processedUrl.includes(pattern));

  // Check for image query parameters
  const hasImageParams = /\.(jpg|jpeg|png|gif|webp|svg|avif)/i.test(processedUrl) ||
                         /\?.*image/i.test(processedUrl) ||
                         /\?.*img/i.test(processedUrl);

  // Check for promotional image patterns
  const isPromotionalImage = isLikelyPromotionalImage(processedUrl);

  // If it's from a known CDN or has image extensions/parameters, and not a promotional image, consider it valid
  if ((hasImageExtension || isCdnImage || hasImageParams) && !isPromotionalImage) {
    // Ensure HTTPS for all URLs
    return processedUrl.replace(/^http:/, 'https:');
  }

  // For URLs that don't match any of our criteria, still return the URL
  // The image component will handle errors if it's not a valid image
  return processedUrl;
}

/**
 * Checks if an image URL is likely a promotional image (like logos, badges, etc.)
 *
 * @param url The image URL to check
 * @returns True if the image is likely promotional, false otherwise
 */
function isLikelyPromotionalImage(url: string): boolean {
  if (!url) return false;

  // Known promotional image patterns
  const promotionalPatterns = [
    // Logos and branding
    'lazmall',
    'lazada-logo',
    'lazada_logo',
    'logo',
    'brand',
    'branding',
    'header',
    'footer',
    'banner',
    'promo',
    'promotion',
    'campaign',
    'sale',
    'discount',
    'offer',
    'deal',
    'voucher',
    'coupon',

    // Badges and icons
    'badge',
    'icon-',
    'icon_',
    'lzd-icon',
    'ico-',
    'ico_',
    'symbol',
    'emblem',
    'medal',
    'trophy',
    'award',
    'ribbon',
    'star',
    'rating',
    'review',
    'verified',
    'official',
    'authentic',
    'genuine',
    'original',
    'guarantee',
    'warranty',
    'certified',
    'approved',
    'recommended',
    'featured',
    'bestseller',
    'popular',
    'trending',
    'hot',
    'new',

    // Delivery and logistics
    'logistics',
    'delivery',
    'shipping',
    'courier',
    'express',
    'cargo',
    'truck',
    'van',
    'box',
    'package',
    'parcel',
    'tracking',
    'shipment',
    'dispatch',
    'arrival',
    'pickup',
    'dropoff',
    'collection',
    'return',
    'exchange',
    'refund',

    // Payment and security
    'payment',
    'secure',
    'security',
    'pci',
    'dss',
    'iso',
    'lock',
    'shield',
    'protection',
    'safe',
    'safety',
    'privacy',
    'confidential',
    'encrypted',
    'encryption',
    'ssl',
    'tls',
    'https',
    'certificate',
    'verification',
    'authentication',
    'authorization',
    'identity',
    'fraud',
    'scam',
    'phishing',
    'malware',
    'virus',
    'trojan',
    'spyware',
    'adware',
    'ransomware',
    'hack',
    'hacker',
    'cracker',
    'breach',
    'leak',
    'vulnerability',
    'exploit',
    'attack',
    'threat',
    'risk',
    'danger',
    'warning',
    'alert',
    'notification',
    'message',
    'announcement',
    'news',
    'update',
    'upgrade',
    'download',
    'upload',
    'install',
    'uninstall',
    'setup',
    'configuration',
    'settings',
    'preferences',
    'options',
    'menu',
    'navigation',
    'sidebar',
    'topbar',
    'bottombar',
    'navbar',
    'toolbar',
    'statusbar',
    'titlebar',
    'taskbar',
    'dock',
    'tray',
    'notification',
    'popup',
    'modal',
    'dialog',
    'window',
    'screen',
    'display',
    'monitor',
    'device',
    'desktop',
    'laptop',
    'tablet',
    'mobile',
    'phone',
    'smartphone',
    'watch',
    'wearable',
    'iot',
    'internet',
    'web',
    'cloud',
    'server',
    'database',
    'storage',
    'backup',
    'restore',
    'recovery',
    'repair',
    'fix',
    'solve',
    'solution',
    'problem',
    'issue',
    'error',
    'bug',
    'glitch',
    'crash',
    'freeze',
    'hang',
    'stuck',
    'loading',
    'buffering',
    'processing',
    'calculating',
    'computing',
    'analyzing',
    'scanning',
    'searching',
    'finding',
    'matching',
    'comparing',
    'sorting',
    'filtering',
    'grouping',
    'categorizing',
    'classifying',
    'organizing',
    'arranging',
    'ordering',
    'ranking',
    'rating',
    'scoring',
    'grading',
    'evaluating',
    'assessing',
    'measuring',
    'monitoring',
    'tracking',
    'logging',
    'recording',
    'capturing',
    'saving',
    'storing',
    'archiving',
    'backing',
    'copying',
    'duplicating',
    'cloning',
    'mirroring',
    'syncing',
    'synchronizing',
    'updating',
    'refreshing',
    'reloading',
    'resetting',
    'restarting',
    'rebooting',
    'shutting',
    'powering',
    'turning',
    'switching',
    'toggling',
    'flipping',
    'rotating',
    'spinning',
    'scrolling',
    'swiping',
    'dragging',
    'dropping',
    'clicking',
    'tapping',
    'pressing',
    'holding',
    'releasing',
    'typing',
    'writing',
    'editing',
    'deleting',
    'removing',
    'adding',
    'inserting',
    'appending',
    'prepending',
    'concatenating',
    'joining',
    'splitting',
    'separating',
    'dividing',
    'multiplying',
    'calculating',
    'computing',
    'processing',

    // Known CDN paths for promotional content
    'tps/images/ims-web',
    'tps/imgextra',
    'tps/tfs/TB1',
    'tps/TB1',
    'tps-60-60',
    'tps-40-40',
    'tps-20-20',

    // QR codes
    'qr-code',
    'qr_code',
    'qrcode',
    'get-the-app',
    'download-app',
    'app-store',
    'play-store',
    'google-play',
    'app-gallery',
  ];

  // Check if the URL contains any promotional patterns
  return promotionalPatterns.some(pattern =>
    url.toLowerCase().includes(pattern.toLowerCase())
  );
}

export function ProductCard({ product }: ProductCardProps) {
  const [imageError, setImageError] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const { formatPrice } = useCurrency();

  // Platform-specific fallback images with type safety
  const platformImages: Record<string, string> = {
    'shopee': '/images/platforms/shopee-placeholder.jpg',
    'lazada': '/images/platforms/lazada-placeholder.jpg',
    'zalora': '/images/platforms/zalora-placeholder.jpg',
    'temu': '/images/platforms/temu-placeholder.jpg',
    'default': '/images/product-placeholder.svg'
  };

  // Use platform-specific fallback if available, otherwise default
  const platformKey = product.platform?.toLowerCase() || 'default';
  const fallbackImageUrl = platformImages[platformKey] || platformImages.default;

  // Validate the image URL
  const validImageUrl = validateImageUrl(product.imageUrl) || fallbackImageUrl;

  // Function to handle image load errors
  const handleImageError = () => {
    console.warn(`Failed to load image for product: ${product.title}`);
    setImageError(true);
  };

  // Calculate discount percentage if original price is available
  const discountPercentage = useMemo(() => {
    if (product.originalPrice && product.originalPrice > product.price) {
      return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
    }
    return null;
  }, [product.price, product.originalPrice]);

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

  // Determine if product should have a badge
  const getBadge = () => {
    if (product.isNew) {
      return { label: 'New', icon: <Flame className="h-3 w-3 mr-1" />, variant: 'default' as const };
    }
    if (product.isBestseller) {
      return { label: 'Bestseller', icon: <Award className="h-3 w-3 mr-1" />, variant: 'secondary' as const };
    }
    if (product.isTrending) {
      return { label: 'Trending', icon: <TrendingUp className="h-3 w-3 mr-1" />, variant: 'default' as const };
    }
    if (discountPercentage && discountPercentage >= 20) {
      return { label: `${discountPercentage}% OFF`, icon: null, variant: 'destructive' as const };
    }
    return null;
  };

  const badge = getBadge();

  return (
    <Card className="flex flex-col overflow-hidden h-full shadow-lg hover:shadow-xl transition-shadow duration-300 group">
      <CardHeader className="p-4 pb-2">
        <div className="aspect-[4/3] relative w-full overflow-hidden rounded-md bg-muted">
          {/* Wishlist button */}
          <button
            onClick={(e) => {
              e.preventDefault();
              setIsWishlisted(!isWishlisted);
            }}
            className="absolute top-2 right-2 z-10 bg-white/80 backdrop-blur-sm p-1.5 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white"
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          >
            <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
          </button>

          {/* Sale badge */}
          {discountPercentage && (
            <div className="absolute top-2 left-2 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              {discountPercentage}% OFF
            </div>
          )}

          {/* Product badge */}
          {badge && (
            <div className="absolute bottom-2 left-2 z-10">
              <Badge variant={badge.variant} className="flex items-center text-xs">
                {badge.icon}
                {badge.label}
              </Badge>
            </div>
          )}

          {/* Product image with enhanced fallback and retry mechanism */}
          {imageError || !validImageUrl ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 p-4">
              <div className="relative w-1/2 h-1/2">
                {product.platform ? (
                  <Image
                    src={platformImages[platformKey] || platformImages.default}
                    alt={`${product.platform} placeholder`}
                    fill
                    className="object-contain opacity-70"
                    unoptimized
                  />
                ) : (
                  <ImageOff className="h-full w-full text-gray-300" />
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                {product.platform ? `${product.platform} product` : 'Image not available'}
              </p>
              {product.imageUrl && (
                <p className="text-xs text-gray-400 mt-1 text-center max-w-full truncate px-2">
                  Failed URL: {product.imageUrl.substring(0, 30)}...
                </p>
              )}
              <button
                onClick={() => setImageError(false)}
                className="mt-2 text-xs text-blue-500 hover:underline"
              >
                Retry Image
              </button>
            </div>
          ) : (
            <div className="absolute inset-0">
              {/* Use a regular img tag with our image proxy for better compatibility */}
              <img
                src={`/api/image-proxy?url=${encodeURIComponent(validImageUrl)}`}
                alt={product.title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={handleImageError}
                loading="lazy"
                crossOrigin="anonymous" // Add cross-origin attribute
              />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2 pb-2 flex-grow">
        {/* Platform badge */}
        <div className="mb-1">
          <Badge variant="outline" className="text-xs font-normal">
            {product.platform}
          </Badge>
        </div>

        {/* Product title */}
        <CardTitle className="text-base leading-tight mb-1 line-clamp-2 h-12">
          <Link href={product.productUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
            {product.title}
          </Link>
        </CardTitle>

        {/* Rating stars - only show if rating is available */}
          {product.rating && (
            <div className="flex items-center mt-1 mb-1">
              <div className="flex mr-1">
                {renderRating(product.rating)}
              </div>
              <span className="text-xs text-muted-foreground">
                ({product.ratingCount || 0})
              </span>
            </div>
          )}

        {/* Brand name if available */}
        {product.brand && (
          <CardDescription className="text-xs text-muted-foreground mt-1">
            {product.brand}
          </CardDescription>
        )}
      </CardContent>
      <CardFooter className="p-4 pt-2 flex justify-between items-center border-t">
        <div>
          <p className="text-lg font-semibold text-primary">
            {formatPrice(product.price)}
          </p>
          {product.originalPrice && product.originalPrice > product.price && (
            <p className="text-xs text-muted-foreground line-through">
              {formatPrice(product.originalPrice)}
            </p>
          )}
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={product.productUrl} target="_blank" rel="noopener noreferrer">
            View Item
            <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
