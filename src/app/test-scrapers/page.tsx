'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/services/scrapers/types';
import { SearchFilters } from '@/services/shopping-apis';

/**
 * Test page for custom scrapers.
 */
export default function TestScrapersPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [platforms, setPlatforms] = useState(['temu', 'shopee', 'lazada']);
  const [useCache, setUseCache] = useState(true);
  const [executionTime, setExecutionTime] = useState<number | null>(null);

  /**
   * Handles the search form submission.
   */
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) {
      setError('Please enter a search query');
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);
    setExecutionTime(null);

    try {
      const startTime = Date.now();

      // Call the test API endpoint
      const response = await fetch(`/api/test-scrapers?query=${encodeURIComponent(query)}&platforms=${platforms.join(',')}&useCache=${useCache}`);
      const data = await response.json();

      const endTime = Date.now();
      setExecutionTime(endTime - startTime);

      if (data.success) {
        setResults(data.results);
      } else {
        setError(data.error || 'An error occurred during the search');
      }
    } catch (err) {
      setError('An error occurred during the search');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Toggles a platform in the platforms array.
   */
  const togglePlatform = (platform: string) => {
    setPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Custom Scrapers Test</h1>

      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-yellow-800">
          This page directly tests the custom scraping solution without using Serper.dev API.
          Use this to verify that the custom scrapers work correctly before enabling them in production.
        </p>
        <p className="text-yellow-800 mt-2">
          <strong>Note:</strong> If scraping fails or no products are found, the system will automatically
          generate fallback mock data to ensure the UI always has something to display.
          Look for the "source" field in the results to identify real vs. fallback data.
        </p>
      </div>

      <form onSubmit={handleSearch} className="mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter search query..."
            className="flex-1 p-2 border rounded"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:bg-blue-300"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="temu"
              checked={platforms.includes('temu')}
              onChange={() => togglePlatform('temu')}
              className="mr-2"
            />
            <label htmlFor="temu">Temu</label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="shopee"
              checked={platforms.includes('shopee')}
              onChange={() => togglePlatform('shopee')}
              className="mr-2"
            />
            <label htmlFor="shopee">Shopee</label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="lazada"
              checked={platforms.includes('lazada')}
              onChange={() => togglePlatform('lazada')}
              className="mr-2"
            />
            <label htmlFor="lazada">Lazada</label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="useCache"
              checked={useCache}
              onChange={() => setUseCache(!useCache)}
              className="mr-2"
            />
            <label htmlFor="useCache">Use Cache</label>
          </div>
        </div>
      </form>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-red-800">
          {error}
        </div>
      )}

      {executionTime !== null && (
        <div className="mb-6">
          <p>Execution time: {executionTime}ms</p>
        </div>
      )}

      {results.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-2">Results ({results.length})</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((product, index) => (
              <div key={index} className="border rounded p-4">
                <div className="aspect-square relative mb-2">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="object-contain w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      No Image
                    </div>
                  )}
                </div>
                <h3 className="font-bold truncate">{product.title}</h3>
                <p className="text-green-600 font-bold">₱{product.price.toFixed(2)}</p>
                <p className="text-sm text-gray-500">{product.platform}</p>
                {product.source && (
                  <p className={`text-xs ${product.source.includes('fallback') ? 'text-orange-400' : 'text-gray-400'}`}>
                    Source: {product.source}
                    {product.source.includes('fallback') && ' (Mock Data)'}
                  </p>
                )}
                <a
                  href={product.productUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-blue-500 hover:underline"
                >
                  View Product
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
