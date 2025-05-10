'use client';

import { Card, CardContent } from "@/components/ui/card";

interface ProductCardSkeletonProps {
  count?: number;
}

/**
 * A skeleton loader for product cards
 * 
 * @param count The number of skeleton cards to display (default: 1)
 */
export function ProductCardSkeleton({ count = 1 }: ProductCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="overflow-hidden">
          <div className="relative aspect-square w-full bg-muted animate-pulse" />
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
              <div className="h-5 w-1/4 bg-muted rounded animate-pulse mt-2" />
              <div className="flex items-center justify-between mt-4">
                <div className="h-4 w-1/3 bg-muted rounded animate-pulse" />
                <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}
