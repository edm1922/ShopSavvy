'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, Clock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SearchSuggestionsProps {
  query: string;
  recentSearches: string[];
  onSelectSuggestion: (suggestion: string) => void;
  className?: string;
}

/**
 * A component that displays search suggestions and recent searches
 */
export function SearchSuggestions({
  query,
  recentSearches,
  onSelectSuggestion,
  className = '',
}: SearchSuggestionsProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [trendingSearches, setTrendingSearches] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate suggestions based on the query
  useEffect(() => {
    if (query.trim().length > 0) {
      // In a real app, this would be an API call to get suggestions
      // For now, we'll generate some fake suggestions
      const fakeSuggestions = [
        `${query} shoes`,
        `${query} dress`,
        `${query} shirt`,
        `${query} pants`,
      ];
      setSuggestions(fakeSuggestions);
      setIsVisible(true);
    } else {
      setSuggestions([]);
      setIsVisible(!!recentSearches.length || !!trendingSearches.length);
    }
  }, [query, recentSearches.length, trendingSearches.length]);

  // Generate trending searches
  useEffect(() => {
    // In a real app, this would be an API call to get trending searches
    // For now, we'll use some fake trending searches
    setTrendingSearches([
      'summer fashion',
      'running shoes',
      'casual dresses',
      'workout clothes',
      'formal wear',
    ]);
  }, []);

  // Handle click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`absolute z-10 w-full bg-indigo-950 border border-purple-500/30 rounded-md shadow-md mt-1 overflow-hidden ${className}`}
    >
      {/* Suggestions based on query */}
      {query.trim().length > 0 && suggestions.length > 0 && (
        <div className="p-2">
          <h3 className="text-xs font-medium text-pink-400 px-2 py-1">
            Suggestions
          </h3>
          <div className="space-y-1">
            {suggestions.map((suggestion, index) => (
              <Button
                key={`suggestion-${index}`}
                variant="ghost"
                className="w-full justify-start text-sm h-8 px-2 text-white hover:bg-purple-800/50 hover:text-pink-300"
                onClick={() => onSelectSuggestion(suggestion)}
              >
                <Search className="h-3.5 w-3.5 mr-2 text-pink-400" />
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Recent searches */}
      {recentSearches.length > 0 && (
        <div className="p-2 border-t border-purple-500/30 first:border-t-0">
          <h3 className="text-xs font-medium text-pink-400 px-2 py-1">
            Recent Searches
          </h3>
          <div className="space-y-1">
            {recentSearches.slice(0, 5).map((search, index) => (
              <Button
                key={`recent-${index}`}
                variant="ghost"
                className="w-full justify-start text-sm h-8 px-2 text-white hover:bg-purple-800/50 hover:text-pink-300"
                onClick={() => onSelectSuggestion(search)}
              >
                <Clock className="h-3.5 w-3.5 mr-2 text-pink-400" />
                {search}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Trending searches */}
      {trendingSearches.length > 0 && (
        <div className="p-2 border-t border-purple-500/30">
          <h3 className="text-xs font-medium text-pink-400 px-2 py-1">
            Trending Searches
          </h3>
          <div className="space-y-1">
            {trendingSearches.map((search, index) => (
              <Button
                key={`trending-${index}`}
                variant="ghost"
                className="w-full justify-start text-sm h-8 px-2 text-white hover:bg-purple-800/50 hover:text-pink-300"
                onClick={() => onSelectSuggestion(search)}
              >
                <TrendingUp className="h-3.5 w-3.5 mr-2 text-pink-400" />
                {search}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
