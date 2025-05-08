// src/components/app/ProductCard.tsx
import { useState } from 'react';
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
import { ExternalLink, ImageOff } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

/**
 * Validates and cleans an image URL.
 *
 * @param url The image URL to validate.
 * @returns The cleaned URL or null if invalid.
 */
function validateImageUrl(url: string | undefined): string | null {
  if (!url) return null;

  // Check if the URL is valid
  try {
    new URL(url);
  } catch (e) {
    // If the URL is relative, it might be valid
    if (!url.startsWith('http') && !url.startsWith('/')) {
      return null;
    }
  }

  // Check if the URL points to an image
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif'];
  const hasImageExtension = imageExtensions.some(ext => url.toLowerCase().includes(ext));

  // If the URL doesn't have an image extension, it might still be an image
  // For example, some CDNs use URLs without extensions
  return url;
}

export function ProductCard({ product }: ProductCardProps) {
  const [imageError, setImageError] = useState(false);

  // Use a fallback image URL if the product image URL is invalid or missing
  const fallbackImageUrl = '/images/product-placeholder.svg';

  // Validate the image URL
  const validImageUrl = validateImageUrl(product.imageUrl) || fallbackImageUrl;

  // Function to handle image load errors
  const handleImageError = () => {
    console.warn(`Failed to load image for product: ${product.title}`);
    setImageError(true);
  };

  return (
    <Card className="flex flex-col overflow-hidden h-full shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="p-4">
        <div className="aspect-[4/3] relative w-full overflow-hidden rounded-md bg-muted">
          {imageError ? (
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <ImageOff className="h-12 w-12 text-muted-foreground opacity-50" />
            </div>
          ) : (
            <Image
              src={validImageUrl}
              alt={product.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
              data-ai-hint={`product ${product.title.split(' ')[0] || 'item'}`}
              priority={false} // Set to true for above-the-fold images if applicable
              onError={handleImageError}
              unoptimized={true} // Skip optimization for all external images
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-lg leading-tight mb-1">
          <Link href={product.productUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
            {product.title}
          </Link>
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">{product.platform}</CardDescription>
      </CardContent>
      <CardFooter className="p-4 flex justify-between items-center border-t">
        <p className="text-xl font-semibold text-primary">
          ${product.price.toFixed(2)}
        </p>
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
