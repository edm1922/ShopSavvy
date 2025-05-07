// src/app/page.tsx
"use client";

import { useState, useCallback } from 'react';
import { Header } from '@/components/app/Header';
import { SearchBar } from '@/components/app/SearchBar';
import { ProductGrid } from '@/components/app/ProductGrid';
import { AiAssistant } from '@/components/app/AiAssistant';
import { searchProducts, type Product, type SearchFilters } from '@/services/shopping-apis';
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [activeFilters, setActiveFilters] = useState<SearchFilters>({});


  const handleSearch = useCallback(async (queryToSearch?: string, filtersToApply?: SearchFilters) => {
    const currentQuery = queryToSearch !== undefined ? queryToSearch : searchQuery;
    const currentFilters = filtersToApply || activeFilters;

    if (!currentQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoadingSearch(true);
    try {
      const products = await searchProducts(currentQuery, currentFilters);
      setSearchResults(products);
    } catch (error) {
      console.error("Failed to search products:", error);
      setSearchResults([]); // Or show an error message
    } finally {
      setIsLoadingSearch(false);
    }
  }, [searchQuery, activeFilters]);

  const handleSuggestionClick = (term: string) => {
    setSearchQuery(term);
    handleSearch(term, {}); // Reset filters when clicking a new suggested term
    setActiveFilters({});
  };
  
  const handleFilterApply = (filterType: string, value: string | number) => {
    let newFilters: SearchFilters = { ...activeFilters };
    if (filterType === 'category') newFilters.category = value as string;
    if (filterType === 'brand') newFilters.brand = value as string;
    if (filterType === 'minPrice') newFilters.minPrice = value as number;
    if (filterType === 'maxPrice') newFilters.maxPrice = value as number;
    if (filterType === 'priceRange') {
      const [min, max] = (value as string).split('-').map(Number);
      newFilters.minPrice = min;
      newFilters.maxPrice = max;
    }
    setActiveFilters(newFilters);
    handleSearch(searchQuery, newFilters);
  };


  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
          <div className="md:col-span-2 space-y-6">
            <SearchBar
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onSearch={() => handleSearch()}
              isLoading={isLoadingSearch}
            />
            {isLoadingSearch ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex flex-col space-y-3">
                    <Skeleton className="h-[200px] w-full rounded-xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[250px]" />
                      <Skeleton className="h-4 w-[200px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ProductGrid products={searchResults} />
            )}
          </div>
          <aside className="md:col-span-1">
            <AiAssistant 
              query={searchQuery} 
              onSuggestionClick={handleSuggestionClick} 
              onFilterApply={handleFilterApply}
            />
          </aside>
        </div>
      </main>
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} ShopSavvy. All rights reserved.</p>
      </footer>
    </div>
  );
}
