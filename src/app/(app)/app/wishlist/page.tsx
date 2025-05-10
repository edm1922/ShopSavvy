'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import {
  getUserPreferences,
  isProductFavorite,
  removeFavoriteProduct
} from '@/services/user-preferences';
import { trackPageView } from '@/services/analytics';
import { Product } from '@/services/types';
import { useRouter } from 'next/navigation';
import {
  Heart,
  Search,
  ChevronRight,
  ShoppingBag,
  Trash2
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
import { ProductCard } from '@/components/app/ProductCard';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function WishlistPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [favoriteProducts, setFavoriteProducts] = useState<string[]>([]);
  const [favoriteProductsData, setFavoriteProductsData] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState('newest');

  // Track page view
  useEffect(() => {
    trackPageView('/app/wishlist', 'ShopSavvy - Wishlist');
  }, []);

  // Load favorite products
  useEffect(() => {
    const userPrefs = getUserPreferences();
    setFavoriteProducts(userPrefs.favoriteProducts);

    // In a real app, we would fetch the favorite products data from an API
    // For now, we'll just create some mock data
    const mockProducts: Product[] = userPrefs.favoriteProducts.map((id, index) => ({
      id,
      title: `Favorite Product ${index + 1}`,
      price: 99.99 - (index * 10),
      imageUrl: `https://picsum.photos/seed/${id}/300/300`,
      productUrl: '#',
      platform: ['Lazada', 'Zalora', 'Shein'][index % 3],
      rating: 4 + (index % 2),
      reviewCount: 100 + (index * 10),
      brand: `Brand ${index + 1}`,
      isNew: index === 0,
      isBestseller: index === 1,
    }));

    setFavoriteProductsData(mockProducts);
  }, []);

  // Handle removing a product from favorites
  const handleRemoveFavorite = (productId: string) => {
    removeFavoriteProduct(productId);
    const userPrefs = getUserPreferences();
    setFavoriteProducts(userPrefs.favoriteProducts);
    setFavoriteProductsData(prev => prev.filter(product => product.id !== productId));
  };

  // Filter products based on search term
  const filteredProducts = searchTerm
    ? favoriteProductsData.filter(product =>
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.platform.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : favoriteProductsData;

  // Sort products based on sort option
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortOption) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'rating':
        return (b.rating || 0) - (a.rating || 0);
      case 'newest':
      default:
        return 0; // Keep original order for "newest"
    }
  });

  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Not Signed In</CardTitle>
            <CardDescription>
              Please sign in to view your wishlist.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push('/login')}>Sign In</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Your Wishlist</h1>
            <p className="text-muted-foreground">
              Products you've saved for later
            </p>
          </div>
          <Button onClick={() => router.push('/app')}>
            <Search className="mr-2 h-4 w-4" />
            Continue Shopping
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Saved Products</CardTitle>
              <Badge variant="secondary">{favoriteProducts.length}</Badge>
            </div>
            <CardDescription>
              Products you've added to your wishlist
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
              <Input
                placeholder="Search your wishlist..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />

              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Sort by:</span>
                <Select value={sortOption} onValueChange={setSortOption}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <ErrorBoundary>
              {sortedProducts.length === 0 ? (
                <div className="text-center py-12">
                  {searchTerm ? (
                    <>
                      <p className="text-muted-foreground mb-2">No products match your search.</p>
                      <Button variant="outline" onClick={() => setSearchTerm('')}>
                        Clear Search
                      </Button>
                    </>
                  ) : (
                    <>
                      <Heart className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
                      <p className="text-muted-foreground mb-4">Your wishlist is empty.</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Save products to your wishlist to keep track of items you're interested in.
                      </p>
                      <Button onClick={() => router.push('/app')}>
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        Start Shopping
                      </Button>
                    </>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sortedProducts.map((product) => (
                    <div key={product.id} className="relative group">
                      <ProductCard product={product} />
                      <Button
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveFavorite(product.id)}
                        aria-label={`Remove ${product.title} from wishlist`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ErrorBoundary>
          </CardContent>
          {sortedProducts.length > 0 && (
            <CardFooter className="flex justify-between border-t pt-6">
              <p className="text-sm text-muted-foreground">
                Showing {sortedProducts.length} of {favoriteProducts.length} products
              </p>
              {searchTerm && (
                <Button variant="ghost" onClick={() => setSearchTerm('')}>
                  Clear Search
                </Button>
              )}
            </CardFooter>
          )}
        </Card>

        <div className="flex justify-center">
          <Button variant="outline" onClick={() => router.push('/app/profile')}>
            Back to Profile
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
