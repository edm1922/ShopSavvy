'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  getUserPreferences,
  saveFilter,
  deleteFilter,
  SavedFilter,
} from '@/services/user-preferences';
import { BookmarkPlus, Trash2, Filter, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SavedFiltersProps {
  currentQuery: string;
  currentFilters: {
    minPrice?: number;
    maxPrice?: number;
    brand?: string;
    category?: string;
    platform?: string;
  };
  onApplyFilter: (filter: SavedFilter) => void;
}

export function SavedFilters({
  currentQuery,
  currentFilters,
  onApplyFilter,
}: SavedFiltersProps) {
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [filterName, setFilterName] = useState('');
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Load saved filters from user preferences
  useEffect(() => {
    const userPreferences = getUserPreferences();
    setSavedFilters(userPreferences.savedFilters);
  }, [saveDialogOpen, viewDialogOpen]);

  // Handle saving a new filter
  const handleSaveFilter = () => {
    if (!filterName.trim()) return;

    saveFilter(filterName, currentQuery, currentFilters);
    setFilterName('');
    setSaveDialogOpen(false);
  };

  // Handle deleting a filter
  const handleDeleteFilter = (filterId: string) => {
    deleteFilter(filterId);
    const userPreferences = getUserPreferences();
    setSavedFilters(userPreferences.savedFilters);
  };

  // Format filter details for display
  const formatFilterDetails = (filter: SavedFilter) => {
    const details = [];

    if (filter.query) {
      details.push(`"${filter.query}"`);
    }

    if (filter.filters.minPrice !== undefined && filter.filters.maxPrice !== undefined) {
      details.push(`$${filter.filters.minPrice} - $${filter.filters.maxPrice}`);
    } else if (filter.filters.minPrice !== undefined) {
      details.push(`Min: $${filter.filters.minPrice}`);
    } else if (filter.filters.maxPrice !== undefined) {
      details.push(`Max: $${filter.filters.maxPrice}`);
    }

    if (filter.filters.brand) {
      details.push(`Brand: ${filter.filters.brand}`);
    }

    if (filter.filters.category) {
      details.push(`Category: ${filter.filters.category}`);
    }

    if (filter.filters.platform) {
      details.push(`Platform: ${filter.filters.platform}`);
    }

    return details.join(', ');
  };

  // Check if there are any current filters applied
  const hasCurrentFilters = Object.values(currentFilters).some(value => value !== undefined);

  return (
    <>
      {/* Save current filter button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-md"
              onClick={() => setSaveDialogOpen(true)}
              disabled={!currentQuery && !hasCurrentFilters}
              aria-label="Save current filter"
            >
              <BookmarkPlus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Save current filter</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* View saved filters button */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-md"
              onClick={() => setViewDialogOpen(true)}
              disabled={savedFilters.length === 0}
              aria-label="View saved filters"
            >
              <Filter className="h-4 w-4" />
              {savedFilters.length > 0 && (
                <Badge
                  variant="secondary"
                  className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                >
                  {savedFilters.length}
                </Badge>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>View saved filters</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Save filter dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Save Filter</DialogTitle>
            <DialogDescription>
              Save your current search and filters for quick access later.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="filter-name">Filter Name</Label>
              <Input
                id="filter-name"
                placeholder="e.g., Summer Dresses"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Filter Details</Label>
              <div className="p-3 bg-muted rounded-md text-sm">
                {currentQuery && <p><strong>Query:</strong> {currentQuery}</p>}
                {currentFilters.minPrice !== undefined && (
                  <p><strong>Min Price:</strong> ${currentFilters.minPrice}</p>
                )}
                {currentFilters.maxPrice !== undefined && (
                  <p><strong>Max Price:</strong> ${currentFilters.maxPrice}</p>
                )}
                {currentFilters.brand && (
                  <p><strong>Brand:</strong> {currentFilters.brand}</p>
                )}
                {currentFilters.category && (
                  <p><strong>Category:</strong> {currentFilters.category}</p>
                )}
                {currentFilters.platform && (
                  <p><strong>Platform:</strong> {currentFilters.platform}</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={handleSaveFilter} disabled={!filterName.trim()}>
              <Save className="h-4 w-4 mr-2" />
              Save Filter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View saved filters dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Saved Filters</DialogTitle>
            <DialogDescription>
              Apply or manage your saved search filters.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[300px] overflow-y-auto">
            {savedFilters.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                You don't have any saved filters yet.
              </p>
            ) : (
              <div className="space-y-3">
                {savedFilters.map((filter) => (
                  <div
                    key={filter.id}
                    className="flex items-center justify-between p-3 bg-muted rounded-md"
                  >
                    <div className="space-y-1">
                      <h4 className="font-medium">{filter.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {formatFilterDetails(filter)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleDeleteFilter(filter.id)}
                        aria-label={`Delete ${filter.name} filter`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onApplyFilter(filter);
                          setViewDialogOpen(false);
                        }}
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
