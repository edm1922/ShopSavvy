'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { getUserPreferences, SavedFilter, deleteFilter } from '@/services/user-preferences';
import { trackPageView } from '@/services/analytics';
import { useRouter } from 'next/navigation';
import { 
  Bookmark, 
  Trash2, 
  ExternalLink,
  ChevronRight,
  Filter,
  Search
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
import { Separator } from '@/components/ui/separator';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export default function SavedFiltersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Track page view
  useEffect(() => {
    trackPageView('/app/saved-filters', 'ShopSavvy - Saved Filters');
  }, []);
  
  // Load saved filters
  useEffect(() => {
    const userPrefs = getUserPreferences();
    setSavedFilters(userPrefs.savedFilters);
  }, []);
  
  // Handle deleting a saved filter
  const handleDeleteFilter = (filterId: string) => {
    deleteFilter(filterId);
    const userPrefs = getUserPreferences();
    setSavedFilters(userPrefs.savedFilters);
  };
  
  // Handle applying a saved filter
  const handleApplyFilter = (filter: SavedFilter) => {
    // Build the query string
    let queryString = filter.query ? `?q=${encodeURIComponent(filter.query)}` : '';
    
    // Add filter parameters
    if (filter.filters.minPrice !== undefined) {
      queryString += `${queryString ? '&' : '?'}minPrice=${filter.filters.minPrice}`;
    }
    if (filter.filters.maxPrice !== undefined) {
      queryString += `${queryString ? '&' : '?'}maxPrice=${filter.filters.maxPrice}`;
    }
    if (filter.filters.brand) {
      queryString += `${queryString ? '&' : '?'}brand=${encodeURIComponent(filter.filters.brand)}`;
    }
    if (filter.filters.category) {
      queryString += `${queryString ? '&' : '?'}category=${encodeURIComponent(filter.filters.category)}`;
    }
    if (filter.filters.platform) {
      queryString += `${queryString ? '&' : '?'}platform=${encodeURIComponent(filter.filters.platform)}`;
    }
    
    // Navigate to the search page with the filter applied
    router.push(`/app${queryString}`);
  };
  
  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };
  
  // Filter saved filters based on search term
  const filteredFilters = searchTerm
    ? savedFilters.filter(filter => 
        filter.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (filter.query && filter.query.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (filter.filters.brand && filter.filters.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (filter.filters.category && filter.filters.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (filter.filters.platform && filter.filters.platform.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : savedFilters;
  
  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Not Signed In</CardTitle>
            <CardDescription>
              Please sign in to view your saved filters.
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
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Saved Filters</h1>
            <p className="text-muted-foreground">
              Quickly access your saved search filters
            </p>
          </div>
          <Button onClick={() => router.push('/app')}>
            <Search className="mr-2 h-4 w-4" />
            New Search
          </Button>
        </div>
        
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle>Your Saved Filters</CardTitle>
              <Badge variant="secondary">{savedFilters.length}</Badge>
            </div>
            <CardDescription>
              Apply your saved filters to quickly find products
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Input
                placeholder="Search your filters..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>
            
            <ErrorBoundary>
              {filteredFilters.length === 0 ? (
                <div className="text-center py-12">
                  {searchTerm ? (
                    <>
                      <p className="text-muted-foreground mb-2">No filters match your search.</p>
                      <Button variant="outline" onClick={() => setSearchTerm('')}>
                        Clear Search
                      </Button>
                    </>
                  ) : (
                    <>
                      <Bookmark className="h-12 w-12 mx-auto text-muted-foreground opacity-20 mb-4" />
                      <p className="text-muted-foreground mb-4">You haven't saved any filters yet.</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Save your search filters to quickly access them later.
                      </p>
                      <Button onClick={() => router.push('/app')}>
                        Start Searching
                      </Button>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredFilters.map((filter) => (
                    <div 
                      key={filter.id} 
                      className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-muted/50 rounded-lg gap-4"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Filter className="h-4 w-4 text-primary" />
                          <h4 className="font-medium">{filter.name}</h4>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {filter.query && `"${filter.query}"`}
                          {filter.filters.minPrice !== undefined && filter.filters.maxPrice !== undefined && 
                            ` • $${filter.filters.minPrice} - $${filter.filters.maxPrice}`}
                          {filter.filters.brand && ` • Brand: ${filter.filters.brand}`}
                          {filter.filters.category && ` • Category: ${filter.filters.category}`}
                          {filter.filters.platform && ` • Platform: ${filter.filters.platform}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Saved on {formatDate(filter.createdAt)}
                        </p>
                      </div>
                      <div className="flex gap-2 self-end md:self-auto">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteFilter(filter.id)}
                          aria-label={`Delete ${filter.name} filter`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleApplyFilter(filter)}
                          className="flex items-center gap-1"
                        >
                          <ExternalLink className="h-4 w-4" />
                          Apply Filter
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ErrorBoundary>
          </CardContent>
          {filteredFilters.length > 0 && (
            <CardFooter className="flex justify-between border-t pt-6">
              <p className="text-sm text-muted-foreground">
                Showing {filteredFilters.length} of {savedFilters.length} filters
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
