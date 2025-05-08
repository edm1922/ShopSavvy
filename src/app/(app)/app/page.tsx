'use client';

import { useState } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ProductGrid } from '@/components/app/ProductGrid';
import { searchProducts } from '@/services/shopping-apis';
import { Product } from '@/services/scrapers/types';

export default function AppPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      console.log('Frontend: Searching for:', searchQuery);

      // Add a loading delay to show the searching state
      await new Promise(resolve => setTimeout(resolve, 500));

      const results = await searchProducts(searchQuery);
      console.log('Frontend: Search results:', results);

      setProducts(results);
    } catch (error) {
      console.error('Frontend: Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    // Keep the products displayed until a new search is performed
  };

  return (
    <div className="space-y-8">
      <div className="text-center max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Find the Best Deals Across All Platforms</h1>
        <p className="text-muted-foreground mb-8">
          Search for products and compare prices from multiple e-commerce platforms.
        </p>

        <form onSubmit={handleSearch} className="flex w-full max-w-2xl mx-auto mb-8">
          <div className="relative flex-grow">
            <Input
              type="text"
              placeholder="Search for products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-r-none pr-10 w-full"
            />
            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                onClick={handleClearSearch}
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button type="submit" className="rounded-l-none" disabled={isSearching}>
            {isSearching ? 'Searching...' : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Search
              </>
            )}
          </Button>
        </form>
      </div>

      {products.length > 0 ? (
        <ProductGrid products={products} />
      ) : (
        <div className="text-center py-12">
          <Search className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-medium mb-2">No products found</h2>
          <p className="text-muted-foreground">
            Try searching for something else or check back later.
          </p>
        </div>
      )}
    </div>
  );
}
