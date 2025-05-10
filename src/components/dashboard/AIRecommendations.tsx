'use client';

import { useState, useEffect } from 'react';
import { RecommendationResponse } from '@/services/ai/deepseek-recommendations';
import { useRouter } from 'next/navigation';

interface AIRecommendationsProps {
  userPreferences?: string[];
  recentSearches?: string[];
  category?: string;
}

/**
 * AI-powered recommendations component for the dashboard
 */
export default function AIRecommendations({
  userPreferences = [],
  recentSearches = [],
  category
}: AIRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch recommendations when the component mounts
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        setLoading(true);
        setError(null);

        // Construct the query parameters
        const params = new URLSearchParams();

        if (userPreferences.length > 0) {
          params.append('preferences', userPreferences.join(','));
        }

        if (recentSearches.length > 0) {
          params.append('recentSearches', recentSearches.join(','));
        }

        if (category) {
          params.append('category', category);
        }

        // Fetch recommendations from the API
        const response = await fetch(`/api/recommendations?${params.toString()}`);
        const data = await response.json();

        if (data.success) {
          setRecommendations(data.recommendations);
        } else {
          setError(data.error || 'Failed to get recommendations');
        }
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setError('Failed to get recommendations');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [userPreferences, recentSearches, category]);

  // Handle clicking on a recommendation
  const handleRecommendationClick = (recommendation: string) => {
    // Extract a search query from the recommendation
    const searchQuery = recommendation
      .toLowerCase()
      .replace(/explore|check out|browse|discover|try|look at/gi, '')
      .trim();

    // Navigate to search page with the query
    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  // Handle clicking on a suggested search
  const handleSearchClick = (search: string) => {
    router.push(`/search?q=${encodeURIComponent(search)}`);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6 animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 bg-blue-200 rounded-full"></div>
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
        </div>
        <div className="space-y-3 mb-5">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded w-4/6"></div>
        </div>
        <div className="mb-5">
          <div className="h-5 bg-gray-200 rounded w-1/3 mb-3"></div>
          <div className="flex flex-wrap gap-2">
            <div className="h-8 bg-blue-100 rounded-full w-24"></div>
            <div className="h-8 bg-blue-100 rounded-full w-32"></div>
            <div className="h-8 bg-blue-100 rounded-full w-28"></div>
          </div>
        </div>
        <div className="mb-5">
          <div className="h-5 bg-gray-200 rounded w-1/3 mb-3"></div>
          <div className="flex flex-wrap gap-2">
            <div className="h-8 bg-gray-100 rounded-full w-28"></div>
            <div className="h-8 bg-gray-100 rounded-full w-36"></div>
            <div className="h-8 bg-gray-100 rounded-full w-24"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <h2 className="text-lg font-semibold mb-2">Personalized Recommendations</h2>
        <p className="text-red-500">
          {error}. Please try again later.
        </p>
      </div>
    );
  }

  if (!recommendations) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-blue-500">
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
          <line x1="12" y1="22.08" x2="12" y2="12"></line>
        </svg>
        <h2 className="text-lg font-semibold">AI Shopping Recommendations</h2>
      </div>

      <p className="text-sm text-gray-600 mb-5">
        {recommendations.explanation}
      </p>

      <div className="mb-5">
        <h3 className="text-md font-medium mb-3">Recommended for You</h3>
        <div className="flex flex-wrap gap-2">
          {recommendations.recommendations.map((recommendation, index) => (
            <button
              key={index}
              onClick={() => handleRecommendationClick(recommendation)}
              className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-full text-sm transition-colors"
            >
              {recommendation}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5">
        <h3 className="text-md font-medium mb-3">Suggested Searches</h3>
        <div className="flex flex-wrap gap-2">
          {recommendations.suggestedSearches.map((search, index) => (
            <button
              key={index}
              onClick={() => handleSearchClick(search)}
              className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-1.5 rounded-full text-sm transition-colors"
            >
              {search}
            </button>
          ))}
        </div>
      </div>

      {recommendations.trendingItems && recommendations.trendingItems.length > 0 && (
        <div>
          <h3 className="text-md font-medium mb-3">Trending Now</h3>
          <div className="flex flex-wrap gap-2">
            {recommendations.trendingItems.map((item, index) => (
              <button
                key={index}
                onClick={() => handleSearchClick(item)}
                className="bg-pink-50 hover:bg-pink-100 text-pink-700 px-3 py-1.5 rounded-full text-sm transition-colors"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
