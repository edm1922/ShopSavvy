// src/components/app/ProductCard.tsx
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
import { ExternalLink } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden h-full shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="p-4">
        <div className="aspect-[4/3] relative w-full overflow-hidden rounded-md">
          <Image
            src={product.imageUrl}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover"
            data-ai-hint={`product ${product.title.split(' ')[0] || 'item'}`}
            priority={false} // Set to true for above-the-fold images if applicable
          />
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
