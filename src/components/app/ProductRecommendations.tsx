'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/services/types';
import { ProductCard } from './ProductCard';
import { getUserPreferences } from '@/services/user-preferences';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw } from 'lucide-react';

interface ProductRecommendationsProps {
  currentProducts: Product[];
  searchQuery?: string;
}

/**
 * Component that displays personalized product recommendations
 */
export function ProductRecommendations({
  currentProducts,
  searchQuery
}: ProductRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendationType, setRecommendationType] = useState<'similar' | 'trending' | 'personalized'>('similar');

  // Generate recommendations based on current products and user preferences
  useEffect(() => {
    if (currentProducts.length === 0) return;

    generateRecommendations();
  }, [currentProducts, recommendationType]);

  // Generate product recommendations
  const generateRecommendations = async () => {
    setIsLoading(true);

    try {
      // In a real app, this would be an API call to a recommendation service
      // For now, we'll generate some mock recommendations

      // Get user preferences
      const userPrefs = getUserPreferences();
      const searchHistory = userPrefs.searchHistory;
      const favoriteProducts = userPrefs.favoriteProducts;

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      let recommendedProducts: Product[] = [];

      switch (recommendationType) {
        case 'similar':
          // Generate similar products based on current products
          recommendedProducts = generateSimilarProducts(currentProducts);
          break;
        case 'trending':
          // Generate trending products
          recommendedProducts = generateTrendingProducts();
          break;
        case 'personalized':
          // Generate personalized recommendations based on user history
          recommendedProducts = generatePersonalizedProducts(searchHistory, favoriteProducts);
          break;
      }

      setRecommendations(recommendedProducts);
    } catch (error) {
      console.error('Error generating recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate similar products based on current products
  const generateSimilarProducts = (products: Product[]): Product[] => {
    // In a real app, this would use product attributes to find similar items
    // For now, we'll create mock similar products
    return Array.from({ length: 4 }).map((_, index) => {
      const baseProduct = products[index % products.length];
      return {
        id: `similar-${baseProduct.id}-${index}`,
        title: `Similar to ${baseProduct.title}`,
        price: baseProduct.price * (0.9 + Math.random() * 0.2), // Price within 10% of original
        imageUrl: `https://picsum.photos/seed/similar-${index}/300/300`,
        productUrl: '#',
        platform: baseProduct.platform,
        rating: baseProduct.rating,
        reviewCount: baseProduct.reviewCount,
        brand: baseProduct.brand,
      };
    });
  };

  // Generate trending products
  const generateTrendingProducts = (): Product[] => {
    // In a real app, this would fetch trending products from an API
    // For now, we'll create mock trending products
    return Array.from({ length: 4 }).map((_, index) => ({
      id: `trending-${index}`,
      title: `Trending Product ${index + 1}`,
      price: 50 + Math.random() * 100,
      imageUrl: `https://picsum.photos/seed/trending-${index}/300/300`,
      productUrl: '#',
      platform: ['Lazada', 'Zalora', 'Shein'][index % 3],
      rating: 4 + (index % 2),
      reviewCount: 100 + (index * 50),
      brand: `Popular Brand ${index + 1}`,
      isTrending: true,
    }));
  };

  // Generate personalized recommendations based on user history
  const generatePersonalizedProducts = (searchHistory: string[], favoriteProducts: string[]): Product[] => {
    // In a real app, this would use user history to generate personalized recommendations
    // For now, we'll create mock personalized products
    return Array.from({ length: 4 }).map((_, index) => {
      const searchTerm = searchHistory[index % searchHistory.length] || 'product';
      return {
        id: `personalized-${index}`,
        title: `${searchTerm} You Might Like`,
        price: 75 + Math.random() * 50,
        imageUrl: `https://picsum.photos/seed/personalized-${index}/300/300`,
        productUrl: '#',
        platform: ['Lazada', 'Zalora', 'Shein'][index % 3],
        rating: 4.5,
        reviewCount: 200 + (index * 30),
        brand: `Recommended Brand ${index + 1}`,
      };
    });
  };

  // If there are no current products, don't show recommendations
  if (currentProducts.length === 0) return null;

  // Limit the number of recommendations to avoid excessive height
  const limitedRecommendations = recommendations.slice(0, 4);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>Recommended For You</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={generateRecommendations}
            disabled={isLoading}
            aria-label="Refresh recommendations"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
        <CardDescription>
          {recommendationType === 'similar' && 'Products similar to your search results'}
          {recommendationType === 'trending' && 'Popular products trending right now'}
          {recommendationType === 'personalized' && 'Personalized recommendations based on your activity'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Button
            variant={recommendationType === 'similar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setRecommendationType('similar')}
            className="text-xs h-8"
          >
            Similar
          </Button>
          <Button
            variant={recommendationType === 'trending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setRecommendationType('trending')}
            className="text-xs h-8"
          >
            Trending
          </Button>
          <Button
            variant={recommendationType === 'personalized' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setRecommendationType('personalized')}
            className="text-xs h-8"
          >
            For You
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="aspect-[4/5] bg-muted animate-pulse rounded-md"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {limitedRecommendations.map((product) => (
              <div key={product.id} className="min-w-0">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
