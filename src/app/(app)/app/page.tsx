'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, X, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ProductGrid } from '@/components/app/ProductGrid';
import { VirtualizedProductGrid } from '@/components/app/VirtualizedProductGrid';
import { PhoneMockup } from '@/components/landing/PhoneMockup';

// Now using the fixed shopping-apis that handles browser environment properly
import { searchProducts } from '@/services/shopping-apis';
import { Product } from '@/services/types';
import AIShoppingAssistant from '@/components/dashboard/AIShoppingAssistant';
import { useDebounce } from '@/hooks/useDebounce';
import { cacheService } from '@/services/cache-service';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { FilterSidebar } from '@/components/app/FilterSidebar';
import { Pagination } from '@/components/app/Pagination';
import { SearchSuggestions } from '@/components/app/SearchSuggestions';
import { SavedFilters } from '@/components/app/SavedFilters';
import { SavedFilter } from '@/services/user-preferences';
import { trackSearch, trackFilterApply, trackPageView } from '@/services/analytics';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AppPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [searchType, setSearchType] = useState('default'); // 'default', 'fast', 'medium', or 'slow'
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [filters, setFilters] = useState<{
    minPrice?: number;
    maxPrice?: number;
    brand?: string;
    category?: string;
    platform?: string;
  }>({});

  // Debounce the search query to prevent excessive API calls
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Calculate filtered products and total pages for pagination
  const filteredProducts = useMemo(() => {
    // Start with all products
    let filtered = [...products];

    // Filter by platform if a platform filter is applied
    if (filters.platform) {
      const platformFilter = filters.platform.toLowerCase();
      filtered = filtered.filter(product => {
        // Get the product platform in lowercase for comparison
        const productPlatform = product.platform.toLowerCase();

        // Check if the product platform contains the filter platform name
        return productPlatform.includes(platformFilter);
      });
    }

    // Filter by price range if min/max price filters are applied
    if (filters.minPrice !== undefined) {
      filtered = filtered.filter(product => product.price >= filters.minPrice!);
    }

    if (filters.maxPrice !== undefined) {
      filtered = filtered.filter(product => product.price <= filters.maxPrice!);
    }

    // Filter by brand if a brand filter is applied
    if (filters.brand) {
      filtered = filtered.filter(product =>
        product.brand?.toLowerCase().includes(filters.brand!.toLowerCase()) ||
        product.title.toLowerCase().includes(filters.brand!.toLowerCase())
      );
    }

    // Filter by category if a category filter is applied
    if (filters.category) {
      filtered = filtered.filter(product =>
        product.category?.toLowerCase().includes(filters.category!.toLowerCase()) ||
        product.title.toLowerCase().includes(filters.category!.toLowerCase())
      );
    }

    // Sort by price if price filters are applied
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      // Sort by price ascending (cheapest first)
      filtered.sort((a, b) => a.price - b.price);
      console.log('Sorting filtered results by price (ascending) due to price filter');
    } else if (searchType === 'cheapest') {
      // Sort by price ascending (cheapest first)
      filtered.sort((a, b) => a.price - b.price);
    } else if (searchType === 'expensive') {
      // Sort by price descending (most expensive first)
      filtered.sort((a, b) => b.price - a.price);
    }

    return filtered;
  }, [products, filters, searchType]);

  // Calculate total pages based on filtered products
  const totalPages = useMemo(() => {
    return Math.ceil(filteredProducts.length / itemsPerPage);
  }, [filteredProducts.length, itemsPerPage]);

  // Get paginated products
  const paginatedProducts = useMemo(() => {
    // Use the already filtered products
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage, itemsPerPage]);

  // Reset to page 1 when products change
  useEffect(() => {
    setCurrentPage(1);
  }, [products.length]);

  // Load recent searches from localStorage on component mount
  useEffect(() => {
    try {
      const savedSearches = localStorage.getItem('recentSearches');
      if (savedSearches) {
        setRecentSearches(JSON.parse(savedSearches));
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  }, []);

  // Get search query and filters from URL parameters
  useEffect(() => {
    // Only run in browser environment
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);

      // Get search query from URL
      const queryParam = url.searchParams.get('q');
      if (queryParam) {
        setSearchQuery(queryParam);
      }

      // Get filters from URL
      const newFilters: {
        minPrice?: number;
        maxPrice?: number;
        brand?: string;
        category?: string;
      } = {};

      const minPriceParam = url.searchParams.get('minPrice');
      if (minPriceParam) {
        newFilters.minPrice = parseInt(minPriceParam);
      }

      const maxPriceParam = url.searchParams.get('maxPrice');
      if (maxPriceParam) {
        newFilters.maxPrice = parseInt(maxPriceParam);
      }

      const brandParam = url.searchParams.get('brand');
      if (brandParam) {
        newFilters.brand = brandParam;
      }

      const categoryParam = url.searchParams.get('category');
      if (categoryParam) {
        newFilters.category = categoryParam;
      }

      // Update filters state if any filters were found
      if (Object.keys(newFilters).length > 0) {
        setFilters(newFilters);
      }

      // Trigger search with the query from URL if we have a query
      if (queryParam) {
        // We'll do this in a separate useEffect to avoid dependency issues
      }
    }
  }, []);

  // We've removed the automatic search on query change
  // Now search only happens when the user explicitly submits the search form

  // Run initial search when component mounts and track page view
  useEffect(() => {
    // Track page view
    trackPageView('/app', 'ShopSavvy - Search');

    // Only run if we have a search query from URL
    if (searchQuery && !isSearching) {
      handleSearchWithQuery(searchQuery);
    }
  }, []);

  // Handle click outside to close search suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.search-container')) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle applying a saved filter
  const handleApplySavedFilter = (filter: SavedFilter) => {
    if (filter.query) {
      setSearchQuery(filter.query);
    }

    setFilters(filter.filters);

    // Track filter apply event
    trackFilterApply(filter.filters);

    // Run search with the saved filter
    if (filter.query) {
      handleSearchWithQuery(filter.query);
    }
  };

  // Function to handle search with a specific query (used by URL parameters)
  // This is now just a wrapper around handleSearch for backward compatibility
  const handleSearchWithQuery = async (query: string) => {
    if (!query.trim()) return;

    // Set the search query and then trigger the search
    setSearchQuery(query);

    // Update URL with current filters
    const url = new URL(window.location.href);
    url.searchParams.set('q', query);

    // Add filters to URL
    if (filters.minPrice !== undefined) url.searchParams.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice !== undefined) url.searchParams.set('maxPrice', filters.maxPrice.toString());
    if (filters.brand) url.searchParams.set('brand', filters.brand);
    if (filters.category) url.searchParams.set('category', filters.category);
    if (filters.platform) url.searchParams.set('platform', filters.platform);

    window.history.pushState({}, '', url);

    // Create a synthetic event to pass to handleSearch
    const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;

    // Call handleSearch with the synthetic event
    handleSearch(syntheticEvent);
  };

  // Retry mechanism for failed searches
  const handleRetry = () => {
    if (debouncedSearchQuery) {
      handleSearchWithQuery(debouncedSearchQuery);
    }
  };

  // Function to add a search query to recent searches
  const addToRecentSearches = (query: string) => {
    const trimmedQuery = query.trim();
    const updatedSearches = [
      trimmedQuery,
      ...recentSearches.filter(s => s !== trimmedQuery)
    ].slice(0, 10); // Keep only the 10 most recent searches

    setRecentSearches(updatedSearches);

    // Save to localStorage
    try {
      localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
    } catch (error) {
      console.error('Error saving recent searches:', error);
    }

    // Update URL with search query for AI Shopping Assistant to detect
    const url = new URL(window.location.href);
    url.searchParams.set('q', trimmedQuery);
    window.history.pushState({}, '', url);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      // Don't search if the query is empty
      return;
    }

    // Clear any previous results before starting a new search
    setProducts([]);

    // For regular search button, we want to use our platform-specific caching
    // This will use cached results for platforms we already have
    // and only fetch fresh results for platforms we don't have

    try {
      setIsSearching(true);
      setExecutionTime(null);
      setError(null);
      console.log('Frontend: Searching for:', searchQuery, 'with search type:', searchType);
      console.log('Frontend: Using filters:', filters);

      // Set search parameters based on search type
      let maxPages = 5; // Use 5 pages for all search types to get enough results
      let sortBy = ''; // Default no sorting

      // Configure search parameters based on search type
      if (searchType === 'cheapest') {
        sortBy = 'price_asc';
        console.log('Frontend: Using CHEAPEST search type - sorting by price ascending');
      } else if (searchType === 'expensive') {
        sortBy = 'price_desc';
        console.log('Frontend: Using EXPENSIVE search type - sorting by price descending');
      } else if (searchType === 'popular') {
        sortBy = 'popularity_desc';
        console.log('Frontend: Using POPULAR search type - sorting by popularity');
      } else if (searchType === 'newest') {
        sortBy = 'date_desc';
        console.log('Frontend: Using NEWEST search type - sorting by date');
      } else {
        console.log('Frontend: Using DEFAULT search type - no special sorting');
      }

      // If a platform filter is applied, only search on that platform
      // Otherwise, use our supported platforms
      let platformsToSearch = ['lazada', 'zalora', 'shein', 'shopee'];

      if (filters.platform) {
        // Map the display platform name to the search platform name
        const platformFilter = filters.platform.toLowerCase();

        // Just use the lowercase version of the platform name
        platformsToSearch = [platformFilter];
      }

      // Create search filters object
      const searchFilters: any = {};
      if (filters.minPrice) searchFilters.minPrice = filters.minPrice;
      if (filters.maxPrice) searchFilters.maxPrice = filters.maxPrice;
      if (filters.brand) searchFilters.brand = filters.brand;
      if (sortBy) searchFilters.sortBy = sortBy;

      // Record start time for execution timing
      const startTime = Date.now();

      // Make a direct API call with platform-specific caching
      const queryParams = new URLSearchParams();
      queryParams.append('query', searchQuery);
      queryParams.append('platforms', platformsToSearch.join(','));
      queryParams.append('maxPages', maxPages.toString());

      // Add filters to query params
      if (searchFilters.minPrice) queryParams.append('minPrice', searchFilters.minPrice.toString());
      if (searchFilters.maxPrice) queryParams.append('maxPrice', searchFilters.maxPrice.toString());
      if (searchFilters.brand) queryParams.append('brand', searchFilters.brand);
      if (searchFilters.platform) queryParams.append('platform', searchFilters.platform);
      if (sortBy) queryParams.append('sortBy', sortBy);

      console.log(`Frontend: Making API call with platform-specific caching: /api/search?${queryParams.toString()}`);

      // Make the API call
      const response = await fetch(`/api/search?${queryParams.toString()}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Search failed');
      }

      const results = data.results || [];
      console.log(`Frontend: Search returned ${results.length} results from ${platformsToSearch.join(', ')}`);

      // Calculate execution time
      const endTime = Date.now();
      setExecutionTime(endTime - startTime);

      // Update products state with results
      setProducts(results);

      // Track search event
      trackSearch(searchQuery, searchFilters, results.length);

      // Add to recent searches
      addToRecentSearches(searchQuery);

      // Store the current search query for refresh button comparison
      localStorage.setItem('lastSearchQuery', searchQuery);
    } catch (error) {
      console.error('Frontend: Search error:', error);
      setError('Sorry, there was an error with the search. Please try again.');
      setRetryCount(prev => prev + 1);
    } finally {
      setIsSearching(false);
    }
  };

  // Function to perform a completely fresh search with cache-busting
  const performFreshSearch = async (query: string, searchFilters: any, platformsToSearch: string[]) => {
    try {
      setIsSearching(true);
      setExecutionTime(null);
      setError(null);
      setProducts([]); // Clear existing products to show loading state

      console.log('Frontend: Performing COMPLETELY FRESH search with ALL cache-busting');

      // Set search parameters based on search type
      let maxPages = 5; // Use 5 pages for all search types to get enough results
      let sortBy = ''; // Default no sorting

      // Determine sort order and query modifications based on search type
      if (searchType === 'cheapest') {
        sortBy = 'price_asc';
        console.log('Frontend: Using CHEAPEST search type - will sort by price ascending');
      } else if (searchType === 'expensive') {
        sortBy = 'price_desc';
        console.log('Frontend: Using EXPENSIVE search type - will sort by price descending');
      } else if (searchType === 'popular') {
        sortBy = 'popularity_desc';
        console.log('Frontend: Using POPULAR search type - will sort by popularity');
      } else if (searchType === 'newest') {
        sortBy = 'date_desc';
        console.log('Frontend: Using NEWEST search type - will prioritize new items');
      } else {
        // Default search type - no special sorting
        console.log('Frontend: Using DEFAULT search type - no special sorting');
      }

      console.log(`Frontend: Using search type: ${searchType} with sortBy=${sortBy} (will request results from ${maxPages} API calls)`);

      // Record start time for execution timing
      const startTime = Date.now();

      // Add a cache-busting timestamp parameter to force a fresh search
      const timestamp = Date.now();

      // Make a direct API call with cache-busting parameter
      const queryParams = new URLSearchParams();
      queryParams.append('query', query);
      queryParams.append('platforms', platformsToSearch.join(','));
      queryParams.append('maxPages', maxPages.toString());
      queryParams.append('cacheBust', timestamp.toString());
      queryParams.append('forceRefresh', 'true'); // Additional parameter to make it clear

      // Add filters to query params
      if (searchFilters.minPrice) queryParams.append('minPrice', searchFilters.minPrice.toString());
      if (searchFilters.maxPrice) queryParams.append('maxPrice', searchFilters.maxPrice.toString());
      if (searchFilters.brand) queryParams.append('brand', searchFilters.brand);
      if (searchFilters.platform) queryParams.append('platform', searchFilters.platform);
      if (sortBy) queryParams.append('sortBy', sortBy);

      console.log(`Frontend: Making direct API call with cache-busting: /api/search?${queryParams.toString()}`);

      // Make the API call
      const response = await fetch(`/api/search?${queryParams.toString()}`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Search failed');
      }

      const results = data.results || [];
      console.log(`Frontend: Fresh search returned ${results.length} results from ${platformsToSearch.join(', ')}`);

      // Calculate execution time
      const endTime = Date.now();
      setExecutionTime(endTime - startTime);

      // Update products state with fresh results
      setProducts(results);

      // Add to recent searches
      addToRecentSearches(query);

      // Store the current search query for refresh button comparison
      localStorage.setItem('lastSearchQuery', query);

      // Don't cache these results in localStorage
      console.log('Frontend: Skipping localStorage caching for fresh search results');
    } catch (error) {
      console.error('Frontend: Fresh search error:', error);
      setError('Sorry, there was an error with the search. Please try again.');
      setRetryCount(prev => prev + 1);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setProducts([]); // Clear the products when clearing the search
    setExecutionTime(null); // Clear execution time
    setError(null); // Clear any errors

    // Clear the last search query from localStorage
    localStorage.removeItem('lastSearchQuery');

    // Clear URL parameters
    const url = new URL(window.location.href);
    url.search = '';
    window.history.pushState({}, '', url);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <form onSubmit={handleSearch} className="flex flex-col max-w-xl mx-auto">
          <div className="flex w-full mb-2">
            <div className="relative flex-1 search-container">
              <Input
                id="search-input"
                type="text"
                placeholder="Enter search terms and click Search button..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10 bg-white/10 border-purple-500/30 text-white placeholder:text-purple-300/50 focus:border-pink-400 focus:ring-pink-400/20"
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearch(e);
                  }
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-300 hover:text-pink-400"
                >
                  <X className="h-4 w-4" />
                </button>
              )}

              {/* Search Suggestions */}
              {showSuggestions && (
                <SearchSuggestions
                  query={searchQuery}
                  recentSearches={recentSearches}
                  onSelectSuggestion={(suggestion) => {
                    setSearchQuery(suggestion);
                    setShowSuggestions(false);
                    // No longer automatically search when a suggestion is selected
                  }}
                />
              )}
            </div>
            <div className="flex gap-2 ml-2">
              <Button
                type="submit"
                disabled={isSearching}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0"
              >
                <Search className="h-4 w-4 mr-1" />
                Search
              </Button>
              <Button
                type="button"
                disabled={isSearching}
                variant={isSearching ? "default" : "outline"}
                className={isSearching ? "bg-pink-600 text-white" : "border-pink-500/30 text-pink-400 hover:bg-pink-500/10 hover:text-pink-300"}
                onClick={() => {
                  // Create search filters object
                  const searchFilters: any = {};
                  if (filters.minPrice) searchFilters.minPrice = filters.minPrice;
                  if (filters.maxPrice) searchFilters.maxPrice = filters.maxPrice;
                  if (filters.brand) searchFilters.brand = filters.brand;
                  if (filters.platform) searchFilters.platform = filters.platform;

                  // Determine platforms to search
                  let platformsToSearch = ['lazada', 'zalora', 'shein', 'shopee'];

                  if (filters.platform) {
                    // Map the display platform name to the search platform name
                    const platformFilter = filters.platform.toLowerCase();

                    if (platformFilter.includes('lazada')) {
                      platformsToSearch = ['lazada'];
                    } else if (platformFilter.includes('zalora')) {
                      platformsToSearch = ['zalora'];
                    } else if (platformFilter.includes('shein')) {
                      platformsToSearch = ['shein'];
                    } else if (platformFilter.includes('shopee')) {
                      platformsToSearch = ['shopee'];
                    } else {
                      // Default to the platform name as is
                      platformsToSearch = [platformFilter];
                    }
                  }

                  // Check if we have the same search query as before
                  const lastSearchQuery = localStorage.getItem('lastSearchQuery');

                  if (lastSearchQuery === searchQuery) {
                    console.log('Frontend: Same search query detected, using cached data to save API credits');
                    // Use the regular search function which will use cached data when available
                    handleSearch({ preventDefault: () => {} } as React.FormEvent);
                  } else {
                    console.log('Frontend: New search query detected, performing fresh search');
                    // Store the current search query for future comparison
                    localStorage.setItem('lastSearchQuery', searchQuery);

                    // Clear local storage cache
                    cacheService.clearSearchResults(
                      searchQuery,
                      searchFilters,
                      platformsToSearch
                    );

                    // Force a completely fresh search with cache-busting
                    performFreshSearch(searchQuery, searchFilters, platformsToSearch);
                  }
                }}

              >
                <RefreshCw className={`h-4 w-4 mr-1 ${isSearching ? 'animate-spin' : ''} text-pink-400`} />
                <span className="text-pink-400">{isSearching ? `Refreshing (${searchType === 'cheapest' ? 'Cheapest' : searchType === 'expensive' ? 'Most Expensive' : searchType === 'popular' ? 'Popular' : searchType === 'newest' ? 'Newest' : 'All Results'})...` : "Refresh"}</span>
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-pink-400">Search type:</span>
              <Select value={searchType} onValueChange={setSearchType}>
                <SelectTrigger className="w-[140px] bg-white/10 border-purple-500/30 text-white focus:ring-pink-400/20 focus:border-pink-400">
                  <SelectValue placeholder="Search type" />
                </SelectTrigger>
                <SelectContent className="bg-indigo-950 border border-purple-500/30">
                  <SelectItem value="default" className="text-white focus:bg-pink-500/10 focus:text-pink-300">All Results</SelectItem>
                  <SelectItem value="cheapest" className="text-white focus:bg-pink-500/10 focus:text-pink-300">Cheapest First</SelectItem>
                  <SelectItem value="expensive" className="text-white focus:bg-pink-500/10 focus:text-pink-300">Most Expensive</SelectItem>
                  <SelectItem value="popular" className="text-white focus:bg-pink-500/10 focus:text-pink-300">Popular/Trending</SelectItem>
                  <SelectItem value="newest" className="text-white focus:bg-pink-500/10 focus:text-pink-300">Newest Items</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              {/* Saved Filters */}
              <SavedFilters
                currentQuery={searchQuery}
                currentFilters={filters}
                onApplyFilter={handleApplySavedFilter}
              />

              {executionTime !== null && (
                <div className="flex items-center text-sm text-pink-400/80">
                  <Clock className="h-3 w-3 mr-1 text-pink-400" />
                  <span>Search time: {(executionTime / 1000).toFixed(2)}s</span>
                </div>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Main content layout */}
      <div id="main-content" className="flex flex-col md:flex-row gap-6">
        {/* Filter sidebar - only show when we have products */}
        {products.length > 0 && (
          <div className="w-full md:w-64 lg:w-72 order-2 md:order-1">
            <ErrorBoundary>
              <FilterSidebar
                products={products}
                onFilterChange={setFilters}
                currentFilters={filters}
                className="sticky top-4"
              />
            </ErrorBoundary>
          </div>
        )}

        <div className={`flex-1 order-1 md:order-2 ${products.length > 0 ? '' : 'md:mx-auto md:max-w-3xl'}`}>
          {/* Error state */}
          {error && (
            <div className="bg-white/10 border border-red-500/20 rounded-lg p-4 mb-6 backdrop-blur-md">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-red-400">{error}</p>
                  <p className="text-sm text-purple-200 mt-1">
                    There was an error with your search. This could be due to network issues or the services being temporarily unavailable.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 flex items-center gap-1 border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                    onClick={handleRetry}
                  >
                    <RefreshCw className="h-3 w-3" />
                    Retry Search
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Main content area wrapped in ErrorBoundary */}
          <ErrorBoundary>
            {/* Display products */}
            {products.length > 0 && !isSearching ? (
              <>
                <div className="flex flex-col space-y-4">
                  {/* Product grid */}
                  {products.length > 30 ? (
                    // Use virtualized grid for large result sets
                    <VirtualizedProductGrid
                      products={paginatedProducts}
                      isLoading={isSearching}
                      skeletonCount={itemsPerPage}
                    />
                  ) : (
                    // Use regular grid for smaller result sets
                    <ProductGrid
                      products={paginatedProducts}
                      isLoading={isSearching}
                      skeletonCount={itemsPerPage}
                    />
                  )}

                  {/* Pagination controls - directly below product grid */}
                  {totalPages > 1 && (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                      className="justify-center"
                    />
                  )}
                </div>
              </>
            ) : (
              <ProductGrid
                products={filteredProducts}
                isLoading={isSearching}
                skeletonCount={itemsPerPage}
              />
            )}
          </ErrorBoundary>
        </div>

        <div className="w-full md:w-80 order-3">
          <ErrorBoundary>
            <AIShoppingAssistant
              products={filteredProducts}
              setProducts={setProducts}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              handleSearchWithQuery={handleSearchWithQuery}
              filters={filters}
              setFilters={setFilters}
              searchType={searchType}
              setSearchType={setSearchType}
            />
          </ErrorBoundary>

          {/* Phone Mockup */}
          {filteredProducts.length > 0 && (
            <div className="mt-6 flex justify-center">
              <div className="w-[280px]">
                <PhoneMockup
                  price={filteredProducts[0].price}
                  productUrl={filteredProducts[0].productUrl}
                  imageUrl={filteredProducts[0].imageUrl}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
