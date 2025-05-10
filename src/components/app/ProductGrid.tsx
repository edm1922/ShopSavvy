// src/components/app/ProductGrid.tsx
'use client';

import { memo } from 'react';
import type { Product } from '@/services/shopping-apis';
import { ProductCard } from './ProductCard';
import { ProductCardSkeleton } from './ProductCardSkeleton';

interface ProductGridProps {
  products: Product[];
  isLoading?: boolean;
  skeletonCount?: number;
}

export const ProductGrid = memo(function ProductGrid({
  products,
  isLoading = false,
  skeletonCount = 6
}: ProductGridProps) {
  // Show skeleton loaders when loading
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <ProductCardSkeleton count={skeletonCount} />
      </div>
    );
  }

  // Show empty state when no products
  if (products.length === 0) {
    return <p className="text-center text-muted-foreground py-8">No products found. Try a different search or adjust your filters!</p>;
  }

  // Show products
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
});
