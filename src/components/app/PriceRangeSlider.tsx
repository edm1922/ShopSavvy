'use client';

import { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCurrency } from '@/contexts/currency-context';

interface PriceRangeSliderProps {
  minPrice?: number;
  maxPrice?: number;
  onPriceChange: (min: number, max: number) => void;
  defaultMin?: number;
  defaultMax?: number;
}

/**
 * A price range slider component with min/max inputs
 */
export function PriceRangeSlider({
  minPrice = 0,
  maxPrice = 10000,
  onPriceChange,
  defaultMin = 0,
  defaultMax = 10000,
}: PriceRangeSliderProps) {
  const [range, setRange] = useState<[number, number]>([defaultMin, defaultMax]);
  const [minInput, setMinInput] = useState<string>(defaultMin.toString());
  const [maxInput, setMaxInput] = useState<string>(defaultMax.toString());
  const { formatPrice, currencySymbol } = useCurrency();

  // Update the inputs when the range changes
  useEffect(() => {
    setMinInput(range[0].toString());
    setMaxInput(range[1].toString());
  }, [range]);

  // Update the range when props change
  useEffect(() => {
    // Only update if the props have changed significantly
    if (maxPrice !== range[1] || minPrice !== range[0]) {
      console.log(`PriceRangeSlider: Props changed - maxPrice: ${maxPrice}, defaultMax: ${defaultMax}`);
      setRange([defaultMin, defaultMax]);
      setMinInput(defaultMin.toString());
      setMaxInput(defaultMax.toString());
    }
  }, [maxPrice, minPrice, defaultMin, defaultMax]);

  // Handle slider change
  const handleSliderChange = (value: number[]) => {
    const [min, max] = value as [number, number];
    setRange([min, max]);
    // Apply changes immediately
    onPriceChange(min, max);
  };

  // Handle min input change
  const handleMinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setMinInput(newValue);

    // Apply changes with a slight delay to avoid too many updates while typing
    const min = parseInt(newValue) || minPrice;
    const max = parseInt(maxInput) || maxPrice;

    // Ensure min is not greater than max
    const validMin = Math.min(min, max);
    const validMax = Math.max(min, max);

    setRange([validMin, validMax]);
    onPriceChange(validMin, validMax);
  };

  // Handle max input change
  const handleMaxInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setMaxInput(newValue);

    // Apply changes immediately
    const min = parseInt(minInput) || minPrice;
    const max = parseInt(newValue) || maxPrice;

    // Ensure min is not greater than max
    const validMin = Math.min(min, max);
    const validMax = Math.max(min, max);

    setRange([validMin, validMax]);
    onPriceChange(validMin, validMax);
  };

  // Handle input blur - ensure values are valid
  const handleInputBlur = () => {
    const min = parseInt(minInput) || minPrice;
    const max = parseInt(maxInput) || maxPrice;

    // Ensure min is not greater than max
    const validMin = Math.min(min, max);
    const validMax = Math.max(min, max);

    setRange([validMin, validMax]);
    setMinInput(validMin.toString());
    setMaxInput(validMax.toString());
    onPriceChange(validMin, validMax);
  };

  // Handle key press (Enter)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    }
  };

  return (
    <div className="space-y-4">
      <Slider
        defaultValue={range}
        min={minPrice}
        max={maxPrice}
        step={100}
        value={range}
        onValueChange={handleSliderChange}
        onValueCommit={handleSliderChange}
        className="my-6"
      />

      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
            {currencySymbol}
          </div>
          <Input
            type="number"
            value={minInput}
            onChange={handleMinInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyPress}
            min={minPrice}
            max={maxPrice}
            placeholder="Min"
            className="w-full pl-8"
          />
        </div>
        <span className="text-muted-foreground">to</span>
        <div className="flex-1 relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
            {currencySymbol}
          </div>
          <Input
            type="number"
            value={maxInput}
            onChange={handleMaxInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyPress}
            min={minPrice}
            max={maxPrice}
            placeholder="Max"
            className="w-full pl-8"
          />
        </div>
      </div>
    </div>
  );
}
