'use client';

import { useRef, useEffect, useState } from 'react';
import { Product } from '@/services/types';
import { ProductCard } from './ProductCard';
import { ProductCardSkeleton } from './ProductCardSkeleton';

interface VirtualizedProductGridProps {
  products: Product[];
  isLoading?: boolean;
  skeletonCount?: number;
  itemHeight?: number;
  overscan?: number;
}

/**
 * A virtualized grid component for displaying products efficiently
 * Only renders products that are visible in the viewport
 */
export function VirtualizedProductGrid({
  products,
  isLoading = false,
  skeletonCount = 6,
  itemHeight = 450, // Approximate height of a product card in pixels
  overscan = 5, // Number of items to render above and below the visible area
}: VirtualizedProductGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  const [containerWidth, setContainerWidth] = useState(0);
  const [columnsCount, setColumnsCount] = useState(3);

  // Calculate the number of columns based on container width
  useEffect(() => {
    if (!containerRef.current) return;

    const updateDimensions = () => {
      const width = containerRef.current?.clientWidth || 0;
      setContainerWidth(width);

      // Determine number of columns based on container width
      let columns = 1;
      if (width >= 1280) columns = 3; // xl
      else if (width >= 768) columns = 2; // md
      else columns = 1; // mobile

      setColumnsCount(columns);
    };

    // Initial calculation
    updateDimensions();

    // Recalculate on resize
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(containerRef.current);

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, []);

  // Update visible range based on scroll position
  useEffect(() => {
    if (!containerRef.current) return;

    const updateVisibleRange = () => {
      const container = containerRef.current;
      if (!container) return;

      const scrollTop = window.scrollY;
      const viewportHeight = window.innerHeight;
      const containerTop = container.getBoundingClientRect().top + window.scrollY;

      // Calculate visible range
      const rowHeight = itemHeight;
      const itemsPerRow = columnsCount;
      const visibleTop = Math.max(0, scrollTop - containerTop);
      const visibleBottom = visibleTop + viewportHeight;

      // Convert to row indices
      const startRow = Math.floor(visibleTop / rowHeight);
      const endRow = Math.ceil(visibleBottom / rowHeight);

      // Convert to item indices with overscan
      const startIndex = Math.max(0, (startRow - overscan) * itemsPerRow);
      const endIndex = Math.min(
        products.length,
        (endRow + overscan) * itemsPerRow
      );

      setVisibleRange({ start: startIndex, end: endIndex });
    };

    // Initial calculation
    updateVisibleRange();

    // Update on scroll
    window.addEventListener('scroll', updateVisibleRange);
    return () => {
      window.removeEventListener('scroll', updateVisibleRange);
    };
  }, [products.length, itemHeight, columnsCount, overscan]);

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

  // Calculate total height to maintain scroll position
  const rowCount = Math.ceil(products.length / columnsCount);

  // Calculate height based on visible products only
  const visibleRowCount = Math.ceil((visibleRange.end - visibleRange.start) / columnsCount);
  const visibleHeight = visibleRowCount * itemHeight;

  // Get visible products
  const visibleProducts = products.slice(visibleRange.start, visibleRange.end);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6"
      >
        {visibleProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
