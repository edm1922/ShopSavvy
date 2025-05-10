'use client';

import { useState, useEffect } from 'react';
import { X, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { PriceRangeSlider } from './PriceRangeSlider';
import { Product } from '@/services/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from '@/components/ui/badge';

interface FilterSidebarProps {
  products: Product[];
  onFilterChange: (filters: any) => void;
  currentFilters: {
    minPrice?: number;
    maxPrice?: number;
    brand?: string;
    category?: string;
    platform?: string;
  };
  className?: string;
}

/**
 * A sidebar component for filtering products
 */
export function FilterSidebar({
  products,
  onFilterChange,
  currentFilters,
  className = '',
}: FilterSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [maxProductPrice, setMaxProductPrice] = useState<number>(10000); // Default max price
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(
    currentFilters.platform ? [currentFilters.platform] : []
  );
  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    currentFilters.brand ? [currentFilters.brand] : []
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    currentFilters.category ? [currentFilters.category] : []
  );

  // Extract unique brands and categories from products, but use fixed platforms
  useEffect(() => {
    // Set fixed platforms that we support
    setPlatforms([
      'Lazada',
      'Zalora',
      'Shein',
      'Shopee'
    ]);

    if (products.length > 0) {
      // Extract brands (if available)
      const uniqueBrands = [...new Set(products
        .filter(product => product.brand)
        .map(product => product.brand as string)
      )];
      setBrands(uniqueBrands);

      // Extract categories (if available)
      const uniqueCategories = [...new Set(products
        .filter(product => product.category)
        .map(product => product.category as string)
      )];
      setCategories(uniqueCategories);

      // Calculate the maximum price from the products
      const prices = products.map(product => product.price);
      const maxPrice = Math.max(...prices);
      // Round up to the nearest 1000 for a cleaner UI
      const roundedMaxPrice = Math.ceil(maxPrice / 1000) * 1000;
      setMaxProductPrice(roundedMaxPrice > 0 ? roundedMaxPrice : 10000);

      console.log(`Calculated max price from products: ${maxPrice}, rounded to: ${roundedMaxPrice}`);
    }
  }, [products]);

  // Handle price range change
  const handlePriceChange = (min: number, max: number) => {
    // Only update if the values have actually changed
    if (min !== currentFilters.minPrice || max !== currentFilters.maxPrice) {
      console.log(`Price filter changed: min=${min}, max=${max}`);
      onFilterChange({
        ...currentFilters,
        minPrice: min,
        maxPrice: max,
      });
    }
  };

  // Handle platform selection
  const handlePlatformChange = (platform: string) => {
    const newSelectedPlatforms = selectedPlatforms.includes(platform)
      ? selectedPlatforms.filter(p => p !== platform)
      : [...selectedPlatforms, platform];

    setSelectedPlatforms(newSelectedPlatforms);

    // When platform filter changes, we need to update the filter
    // and force a new search to avoid showing cached results from other platforms
    onFilterChange({
      ...currentFilters,
      platform: newSelectedPlatforms.length === 1 ? newSelectedPlatforms[0] : undefined,
    });
  };

  // Handle brand selection
  const handleBrandChange = (brand: string) => {
    const newSelectedBrands = selectedBrands.includes(brand)
      ? selectedBrands.filter(b => b !== brand)
      : [...selectedBrands, brand];

    setSelectedBrands(newSelectedBrands);

    onFilterChange({
      ...currentFilters,
      brand: newSelectedBrands.length === 1 ? newSelectedBrands[0] : undefined,
    });
  };

  // Handle category selection
  const handleCategoryChange = (category: string) => {
    const newSelectedCategories = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category];

    setSelectedCategories(newSelectedCategories);

    onFilterChange({
      ...currentFilters,
      category: newSelectedCategories.length === 1 ? newSelectedCategories[0] : undefined,
    });
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedPlatforms([]);
    setSelectedBrands([]);
    setSelectedCategories([]);
    onFilterChange({});
  };

  // Count active filters
  const activeFilterCount =
    (currentFilters.minPrice !== undefined ? 1 : 0) +
    (currentFilters.maxPrice !== undefined ? 1 : 0) +
    (currentFilters.platform ? 1 : 0) +
    (currentFilters.brand ? 1 : 0) +
    (currentFilters.category ? 1 : 0);

  return (
    <div className={`bg-card rounded-lg shadow-sm border p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          <h3 className="font-medium">Filters</h3>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFilterCount}
            </Badge>
          )}
        </div>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>
        )}
      </div>

      <Accordion type="multiple" defaultValue={['price', 'platform']}>
        {/* Price Range Filter */}
        <AccordionItem value="price">
          <AccordionTrigger className="py-2">Price Range</AccordionTrigger>
          <AccordionContent>
            <PriceRangeSlider
              minPrice={0}
              maxPrice={maxProductPrice}
              defaultMin={currentFilters.minPrice || 0}
              defaultMax={currentFilters.maxPrice || maxProductPrice}
              onPriceChange={handlePriceChange}
            />
          </AccordionContent>
        </AccordionItem>

        {/* Platform Filter */}
        {platforms.length > 0 && (
          <AccordionItem value="platform">
            <AccordionTrigger className="py-2">Platform</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2">
                {platforms.map(platform => (
                  <div key={platform} className="flex items-center space-x-2">
                    <Checkbox
                      id={`platform-${platform}`}
                      checked={selectedPlatforms.includes(platform)}
                      onCheckedChange={() => handlePlatformChange(platform)}
                    />
                    <label
                      htmlFor={`platform-${platform}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {platform}
                    </label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Brand Filter */}
        {brands.length > 0 && (
          <AccordionItem value="brand">
            <AccordionTrigger className="py-2">Brand</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {brands.map(brand => (
                  <div key={brand} className="flex items-center space-x-2">
                    <Checkbox
                      id={`brand-${brand}`}
                      checked={selectedBrands.includes(brand)}
                      onCheckedChange={() => handleBrandChange(brand)}
                    />
                    <label
                      htmlFor={`brand-${brand}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {brand}
                    </label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Category Filter */}
        {categories.length > 0 && (
          <AccordionItem value="category">
            <AccordionTrigger className="py-2">Category</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {categories.map(category => (
                  <div key={category} className="flex items-center space-x-2">
                    <Checkbox
                      id={`category-${category}`}
                      checked={selectedCategories.includes(category)}
                      onCheckedChange={() => handleCategoryChange(category)}
                    />
                    <label
                      htmlFor={`category-${category}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      {category}
                    </label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
}
