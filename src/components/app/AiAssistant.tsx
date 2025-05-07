// src/components/app/AiAssistant.tsx
"use client";

import { useEffect, useState, useCallback } from 'react';
import type { SuggestSearchTermsOutput } from '@/ai/flows/suggest-search-terms';
import { getAiSuggestions } from '@/app/actions';
import { useDebounce } from '@/hooks/use-debounce';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lightbulb, Loader2, AlertTriangle } from 'lucide-react';
import { Separator } from '../ui/separator';

interface AiAssistantProps {
  query: string;
  onSuggestionClick: (term: string) => void;
  onFilterApply?: (filterType: string, value: string | number) => void; // For future filter application
}

export function AiAssistant({ query, onSuggestionClick, onFilterApply }: AiAssistantProps) {
  const [suggestionsOutput, setSuggestionsOutput] = useState<SuggestSearchTermsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debouncedQuery = useDebounce(query, 750); // Debounce AI call

  const fetchSuggestions = useCallback(async (currentQuery: string) => {
    if (!currentQuery.trim() || currentQuery.length < 3) { // Only fetch for queries longer than 2 chars
      setSuggestionsOutput(null);
      setError(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await getAiSuggestions({ query: currentQuery });
      setSuggestionsOutput(result);
    } catch (err) {
      console.error("AI Assistant error:", err);
      setError("Failed to load AI suggestions. Please try again.");
      setSuggestionsOutput(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestions(debouncedQuery);
  }, [debouncedQuery, fetchSuggestions]);

  const handleFilterClick = (filterType: string, value: string | number | undefined) => {
    if (value === undefined || !onFilterApply) return;
    onFilterApply(filterType, value);
    // Potentially also update search query with filter, e.g. onSuggestionClick(`${query} ${value}`)
  };

  return (
    <Card className="shadow-lg sticky top-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg">
          <Lightbulb className="mr-2 h-5 w-5 text-primary" />
          AI Shopping Assistant
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            <span>Generating suggestions...</span>
          </div>
        )}
        {error && (
          <div className="flex items-center text-destructive py-4">
            <AlertTriangle className="mr-2 h-5 w-5" />
            <span>{error}</span>
          </div>
        )}
        {!isLoading && !error && !suggestionsOutput?.suggestions?.length && !suggestionsOutput?.filters && (
          <p className="text-sm text-muted-foreground py-4">
            {query.trim().length < 3 && query.trim().length > 0 ? "Keep typing to get suggestions..." : "Enter a search query to get AI-powered suggestions and filters."}
          </p>
        )}
        
        {suggestionsOutput?.suggestions && suggestionsOutput.suggestions.length > 0 && (
          <div className="space-y-2 mb-4">
            <h4 className="font-semibold text-sm">Suggested Searches:</h4>
            <div className="flex flex-wrap gap-2">
              {suggestionsOutput.suggestions.map((term, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => onSuggestionClick(term)}
                  className="text-xs"
                >
                  {term}
                </Button>
              ))}
            </div>
          </div>
        )}

        {suggestionsOutput?.filters && Object.keys(suggestionsOutput.filters).length > 0 && (
          <>
          {suggestionsOutput?.suggestions && suggestionsOutput.suggestions.length > 0 && <Separator className="my-4" />}
          <div className="space-y-3">
            <h4 className="font-semibold text-sm">Suggested Filters:</h4>
            {suggestionsOutput.filters.category && (
              <div>
                <span className="text-xs font-medium">Category: </span>
                <Badge variant="secondary" className="cursor-pointer hover:bg-accent hover:text-accent-foreground" onClick={() => handleFilterClick('category', suggestionsOutput.filters?.category)}>
                  {suggestionsOutput.filters.category}
                </Badge>
              </div>
            )}
            {suggestionsOutput.filters.brand && (
               <div>
                <span className="text-xs font-medium">Brand: </span>
                <Badge variant="secondary" className="cursor-pointer hover:bg-accent hover:text-accent-foreground" onClick={() => handleFilterClick('brand', suggestionsOutput.filters?.brand)}>
                  {suggestionsOutput.filters.brand}
                </Badge>
              </div>
            )}
            {(suggestionsOutput.filters.minPrice !== undefined || suggestionsOutput.filters.maxPrice !== undefined) && (
              <div>
                <span className="text-xs font-medium">Price: </span>
                {suggestionsOutput.filters.minPrice !== undefined && suggestionsOutput.filters.maxPrice !== undefined && (
                  <Badge variant="secondary" className="cursor-pointer hover:bg-accent hover:text-accent-foreground" onClick={() => handleFilterClick('priceRange', `${suggestionsOutput.filters?.minPrice}-${suggestionsOutput.filters?.maxPrice}`)}>
                    ${suggestionsOutput.filters.minPrice} - ${suggestionsOutput.filters.maxPrice}
                  </Badge>
                )}
                {suggestionsOutput.filters.minPrice !== undefined && suggestionsOutput.filters.maxPrice === undefined && (
                  <Badge variant="secondary" className="cursor-pointer hover:bg-accent hover:text-accent-foreground" onClick={() => handleFilterClick('minPrice', suggestionsOutput.filters?.minPrice)}>
                    Min: ${suggestionsOutput.filters.minPrice}
                  </Badge>
                )}
                {suggestionsOutput.filters.minPrice === undefined && suggestionsOutput.filters.maxPrice !== undefined && (
                   <Badge variant="secondary" className="cursor-pointer hover:bg-accent hover:text-accent-foreground" onClick={() => handleFilterClick('maxPrice', suggestionsOutput.filters?.maxPrice)}>
                    Max: ${suggestionsOutput.filters.maxPrice}
                  </Badge>
                )}
              </div>
            )}
          </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
