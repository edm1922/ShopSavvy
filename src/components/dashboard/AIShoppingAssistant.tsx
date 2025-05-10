'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SearchFilters } from '@/services/shopping-apis';
import { Product } from '@/services/types';
import {
  MessageSquare,
  Sparkles,
  Tag,
  Filter,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  Search,
  TrendingUp,
  Clock
} from 'lucide-react';
import { useCurrency } from '@/contexts/currency-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';

interface AIShoppingAssistantProps {
  products: Product[];
  setProducts: (products: Product[]) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleSearchWithQuery: (query: string) => void;
  // Add additional props for more control over search behavior
  filters?: SearchFilters;
  setFilters?: (filters: SearchFilters) => void;
  searchType?: string;
  setSearchType?: (type: string) => void;
}

/**
 * AI Shopping Assistant component that provides suggestions and filters
 */
export default function AIShoppingAssistant({
  products,
  setProducts,
  searchQuery,
  setSearchQuery,
  handleSearchWithQuery,
  filters = {},
  setFilters,
  searchType = 'default',
  setSearchType
}: AIShoppingAssistantProps) {
  const searchParams = useSearchParams();
  const currentQuery = searchParams.get('q') || searchQuery;
  const [suggestedSearches, setSuggestedSearches] = useState<string[]>([]);
  const [suggestedFilters, setSuggestedFilters] = useState<{
    category?: string;
    price?: string;
    minPrice?: number;
    maxPrice?: number;
    brand?: string;
  }>({});
  const router = useRouter();
  const [originalProducts, setOriginalProducts] = useState<Product[]>([]);
  const { formatPrice, currency } = useCurrency();

  // New state variables for enhanced features
  const [activeTab, setActiveTab] = useState('suggestions');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [trendingSearches, setTrendingSearches] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [productInsights, setProductInsights] = useState<string[]>([]);
  const [feedbackGiven, setFeedbackGiven] = useState<{[key: string]: 'up' | 'down'}>({});
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [chatInput, setChatInput] = useState('');

  // Store original products when they change
  useEffect(() => {
    if (products.length > 0) {
      setOriginalProducts(products);
    }
  }, [products]);

  // Generate suggestions based on the current search query
  useEffect(() => {
    if (currentQuery) {
      // This would normally be an API call to get AI-generated suggestions
      // For now, we'll generate some relevant suggestions based on the query
      generateSuggestions(currentQuery);

      // Analyze products when they change and we have a query
      if (products.length > 0) {
        analyzeProducts();
      }
    } else {
      setSuggestedSearches([]);
      setSuggestedFilters({});
    }
  }, [currentQuery, products]);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const savedSearches = localStorage.getItem('recentSearches');
      if (savedSearches) {
        setRecentSearches(JSON.parse(savedSearches));
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }

    // Set trending searches (in a real app, this would come from an API)
    setTrendingSearches([
      'summer fashion',
      'running shoes',
      'casual dresses',
      'workout clothes',
      'formal wear',
    ]);
  }, []);

  const generateSuggestions = (query: string) => {
    // This is where you would call your AI API to get suggestions
    // For now, we'll use some simple logic to generate suggestions
    const lowerQuery = query.toLowerCase();

    // Generate suggested searches based on the query
    let searches: string[] = [];
    if (lowerQuery.includes('shoe') || lowerQuery.includes('shoes')) {
      searches = ['running shoes', 'sandals', 'boots'];
    } else if (lowerQuery.includes('dress')) {
      searches = ['summer dresses', 'formal dresses', 'casual dresses'];
    } else if (lowerQuery.includes('shirt') || lowerQuery.includes('t-shirt')) {
      searches = ['graphic tees', 'polo shirts', 'button-up shirts'];
    } else {
      searches = ['popular items', 'trending now', 'best sellers'];
    }

    // Generate suggested filters based on the query
    let filters: {
      category?: string;
      price?: string;
      minPrice?: number;
      maxPrice?: number;
      brand?: string;
    } = {};

    if (lowerQuery.includes('shoe') || lowerQuery.includes('shoes')) {
      filters.category = "men's shoes";
      filters.price = "Max $100";
      filters.maxPrice = 100;

      // Add brand if mentioned
      if (lowerQuery.includes('nike')) {
        filters.brand = "Nike";
      } else if (lowerQuery.includes('adidas')) {
        filters.brand = "Adidas";
      }
    } else if (lowerQuery.includes('dress')) {
      filters.category = "women's dresses";
      filters.price = "Max $150";
      filters.maxPrice = 150;

      // Add brand if mentioned
      if (lowerQuery.includes('zara')) {
        filters.brand = "Zara";
      }
    } else if (lowerQuery.includes('shirt') || lowerQuery.includes('t-shirt')) {
      filters.category = "casual shirts";
      filters.price = "Max $50";
      filters.maxPrice = 50;
    }

    setSuggestedSearches(searches);
    setSuggestedFilters(filters);
  };

  const handleSuggestedSearch = (search: string) => {
    // Check if we have the same search query as before
    const lastSearchQuery = localStorage.getItem('lastSearchQuery');

    // If it's a new search term, perform a new search
    if (search !== currentQuery) {
      setSearchQuery(search);

      // Store the current search query for refresh button comparison
      localStorage.setItem('lastSearchQuery', search);

      // Perform the search
      handleSearchWithQuery(search);

      // Update URL without page reload
      const url = new URL(window.location.href);
      url.searchParams.set('q', search);
      window.history.pushState({}, '', url);

      // Add a chat message from the assistant about the new search
      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `I'm searching for "${search}" for you. Let me know if you want to refine these results.`
        }
      ]);

      return;
    }

    // If it's the same query but we want to filter the existing results
    if (originalProducts.length > 0) {
      // Filter the products based on the search term
      const lowerSearch = search.toLowerCase();
      const filteredProducts = originalProducts.filter(product => {
        const title = product.title.toLowerCase();
        const description = product.description?.toLowerCase() || '';

        // Check if the product matches the search term
        return title.includes(lowerSearch) || description.includes(lowerSearch);
      });

      // Update the products state with the filtered products
      setProducts(filteredProducts);

      // Add a chat message from the assistant about filtering
      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `I've filtered the results to better match "${search}". Found ${filteredProducts.length} items.`
        }
      ]);

      // Update URL without page reload
      const url = new URL(window.location.href);
      url.searchParams.set('q', search);
      window.history.pushState({}, '', url);
    } else {
      // If we don't have original products, perform a new search
      setSearchQuery(search);

      // Store the current search query for refresh button comparison
      localStorage.setItem('lastSearchQuery', search);

      // Perform the search
      handleSearchWithQuery(search);

      // Update URL without page reload
      const url = new URL(window.location.href);
      url.searchParams.set('q', search);
      window.history.pushState({}, '', url);
    }
  };

  // Analyze products to generate detailed insights
  const analyzeProducts = () => {
    setIsAnalyzing(true);

    // Generate comprehensive insights based on the products
    const insights: string[] = [];

    if (products.length > 0) {
      // Get price range and distribution
      const prices = products.map(p => p.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      const medianPrice = [...prices].sort((a, b) => a - b)[Math.floor(prices.length / 2)];

      // Price distribution
      const under50 = prices.filter(p => p < 50).length;
      const under100 = prices.filter(p => p >= 50 && p < 100).length;
      const under200 = prices.filter(p => p >= 100 && p < 200).length;
      const over200 = prices.filter(p => p >= 200).length;

      insights.push(`Price range: ${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`);
      insights.push(`Average price: ${formatPrice(avgPrice)}, Median: ${formatPrice(medianPrice)}`);
      insights.push(`Price distribution: ${under50} items under ${formatPrice(50)}, ${under100} between ${formatPrice(50)}-${formatPrice(100)}, ${under200} between ${formatPrice(100)}-${formatPrice(200)}, ${over200} over ${formatPrice(200)}`);

      // Get platform distribution
      const platformCounts: {[key: string]: number} = {};
      products.forEach(p => {
        platformCounts[p.platform] = (platformCounts[p.platform] || 0) + 1;
      });

      // Sort platforms by count
      const sortedPlatforms = Object.entries(platformCounts)
        .sort((a, b) => b[1] - a[1]);

      if (sortedPlatforms.length > 0) {
        const platformInsight = sortedPlatforms
          .map(([platform, count]) => `${platform} (${count})`)
          .join(', ');

        insights.push(`Platform distribution: ${platformInsight}`);
      }

      // Extract common keywords from titles
      const words = products.flatMap(p =>
        p.title.toLowerCase().split(/\s+/).filter(word => word.length > 3)
      );
      const wordCounts: {[key: string]: number} = {};
      words.forEach(word => {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      });

      // Get top keywords
      const topKeywords = Object.entries(wordCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([word]) => word);

      if (topKeywords.length > 0) {
        insights.push(`Common features: ${topKeywords.join(', ')}`);
      }

      // Add product-specific insights based on query
      const lowerQuery = currentQuery.toLowerCase();

      if (lowerQuery.includes('shoe') || lowerQuery.includes('sneaker') || lowerQuery.includes('footwear')) {
        insights.push('Tip: Look for cushioned insoles for better comfort during extended wear');
        insights.push('Tip: Memory foam insoles provide better support for everyday use');
      }
      else if (lowerQuery.includes('dress') || lowerQuery.includes('gown')) {
        insights.push('Tip: A-line dresses are flattering for most body types');
        insights.push('Tip: Check size charts carefully as sizing can vary between brands');
      }
      else if (lowerQuery.includes('shirt') || lowerQuery.includes('top') || lowerQuery.includes('blouse')) {
        insights.push('Tip: Cotton and linen fabrics are best for hot weather');
        insights.push('Tip: Check shoulder measurements for the best fit');
      }
      else if (lowerQuery.includes('bag') || lowerQuery.includes('purse') || lowerQuery.includes('handbag')) {
        insights.push('Tip: Crossbody bags are practical for everyday use');
        insights.push('Tip: Check interior compartments for organization features');
      }
    }

    setProductInsights(insights);
    setIsAnalyzing(false);

    // Add an initial assistant message if this is the first search
    if (chatMessages.length === 0 && products.length > 0) {
      // Get detailed product information for a comprehensive initial message
      const prices = products.map(p => p.price);
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      // Get platform distribution
      const platformCounts: {[key: string]: number} = {};
      products.forEach(p => {
        platformCounts[p.platform] = (platformCounts[p.platform] || 0) + 1;
      });

      // Sort platforms by count
      const platforms = Object.entries(platformCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([platform, count]) => `${platform} (${count})`);

      // Extract common keywords from titles
      const words = products.flatMap(p =>
        p.title.toLowerCase().split(/\s+/).filter(word => word.length > 3)
      );
      const wordCounts: {[key: string]: number} = {};
      words.forEach(word => {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      });

      // Get top keywords
      const topKeywords = Object.entries(wordCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([word]) => word);

      // Sort products by price
      const sortedByPrice = [...products].sort((a, b) => a.price - b.price);
      const cheapestProduct = sortedByPrice[0];

      setChatMessages([
        {
          role: 'assistant',
          content: `I've analyzed ${products.length} products matching "${currentQuery}".\n\n` +
            `Price range: ${formatPrice(minPrice)} to ${formatPrice(maxPrice)}\n\n` +
            `Best budget option: ${cheapestProduct.title} at ${formatPrice(cheapestProduct.price)} from ${cheapestProduct.platform}\n\n` +
            `Available from: ${platforms.join(', ')}\n\n` +
            `Popular features: ${topKeywords.join(', ')}\n\n` +
            `How would you like me to help narrow down these results?`
        }
      ]);
    }
  };

  // Handle chat input submission with more interactive responses and search actions
  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!chatInput.trim()) return;

    const userInput = chatInput.trim();

    // Add user message
    const newMessages = [
      ...chatMessages,
      { role: 'user' as const, content: userInput }
    ];

    setChatMessages(newMessages);
    setChatInput('');

    // Process the user input to determine intent and actions
    processUserInput(userInput, newMessages);
  };

  // Process user input to determine intent and take appropriate actions
  const processUserInput = (input: string, currentMessages: {role: 'user' | 'assistant', content: string}[]) => {
    const lowerInput = input.toLowerCase();

    // Immediately analyze the input for product search intent
    // This is a more advanced NLP-like approach that treats any product mention as a search
    const extractProductQuery = (text: string): string | null => {
      // Common product categories
      const categories = [
        'shoes', 'shirt', 'dress', 'pants', 'jeans', 'jacket', 'coat', 'sweater',
        'hoodie', 'bag', 'handbag', 'watch', 'jewelry', 'hat', 'cap', 'socks',
        'underwear', 'swimwear', 'bikini', 'suit', 'tie', 'scarf', 'gloves',
        'boots', 'sneakers', 'sandals', 'heels', 'flats', 'blouse', 'skirt',
        'shorts', 'leggings', 'top', 'bottom', 'outfit', 'accessories'
      ];

      // Gender/demographic qualifiers
      const qualifiers = ['men', 'women', 'kids', 'children', 'baby', 'boys', 'girls', 'unisex'];

      // Check for direct product mentions
      for (const category of categories) {
        if (text.includes(category)) {
          // Extract the full phrase around the category
          const words = text.split(' ');
          const categoryIndex = words.findIndex(word =>
            word.includes(category) || category.includes(word)
          );

          if (categoryIndex !== -1) {
            // Get words before and after to form a complete query
            const startIndex = Math.max(0, categoryIndex - 3);
            const endIndex = Math.min(words.length, categoryIndex + 4);
            const relevantPhrase = words.slice(startIndex, endIndex).join(' ');

            // Clean up the phrase
            return relevantPhrase.replace(/[?.,!]/g, '').trim();
          }

          return category;
        }
      }

      // Check for queries with qualifiers
      for (const qualifier of qualifiers) {
        if (text.includes(qualifier)) {
          // This might be a product query with a demographic qualifier
          const words = text.split(' ');
          const qualifierIndex = words.findIndex(word =>
            word.includes(qualifier) || qualifier.includes(word)
          );

          if (qualifierIndex !== -1) {
            // Get words after the qualifier to form a complete query
            const endIndex = Math.min(words.length, qualifierIndex + 5);
            const relevantPhrase = words.slice(qualifierIndex, endIndex).join(' ');

            // Clean up the phrase
            return relevantPhrase.replace(/[?.,!]/g, '').trim();
          }

          return qualifier;
        }
      }

      return null;
    };

    // First check for explicit search intents
    const hasExplicitSearchIntent =
      lowerInput.includes('search for') ||
      lowerInput.includes('find') ||
      lowerInput.includes('look for') ||
      lowerInput.includes('show me');

    let searchQuery = '';

    // Extract query from explicit search intent
    if (hasExplicitSearchIntent) {
      if (lowerInput.includes('search for')) {
        searchQuery = input.substring(input.indexOf('search for') + 'search for'.length).trim();
      } else if (lowerInput.includes('find')) {
        searchQuery = input.substring(input.indexOf('find') + 'find'.length).trim();
      } else if (lowerInput.includes('look for')) {
        searchQuery = input.substring(input.indexOf('look for') + 'look for'.length).trim();
      } else if (lowerInput.includes('show me')) {
        searchQuery = input.substring(input.indexOf('show me') + 'show me'.length).trim();
      }
    }
    // If no explicit search intent, try to extract product query
    else {
      const productQuery = extractProductQuery(lowerInput);
      if (productQuery) {
        searchQuery = productQuery;
      }
    }

    // If we have a search query (explicit or implicit), process it
    if (searchQuery) {
      // First check if we already have results that we can filter
      if (originalProducts.length > 0) {
        // Filter existing results instead of making a new search
        const lowerSearchQuery = searchQuery.toLowerCase();
        const filteredProducts = originalProducts.filter(product => {
          const title = product.title.toLowerCase();
          const description = product.description?.toLowerCase() || '';
          const category = product.category?.toLowerCase() || '';

          return title.includes(lowerSearchQuery) ||
                 description.includes(lowerSearchQuery) ||
                 category.includes(lowerSearchQuery);
        });

        if (filteredProducts.length > 0) {
          // We found matching products in our existing results
          setProducts(filteredProducts);

          // Get detailed product information for a comprehensive response
          const prices = filteredProducts.map(p => p.price);
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);

          // Get platform distribution
          const platformCounts: {[key: string]: number} = {};
          filteredProducts.forEach(p => {
            platformCounts[p.platform] = (platformCounts[p.platform] || 0) + 1;
          });

          // Sort platforms by count
          const platforms = Object.entries(platformCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([platform, count]) => `${platform} (${count})`);

          // Sort products by price
          const sortedByPrice = [...filteredProducts].sort((a, b) => a.price - b.price);
          const cheapestProduct = sortedByPrice[0];

          // Respond with the filtered results
          const response = `I've filtered the existing results to show ${filteredProducts.length} items matching "${searchQuery}".\n\n` +
            `Price range: ${formatPrice(minPrice)} to ${formatPrice(maxPrice)}\n\n` +
            `Best option: ${cheapestProduct.title} at ${formatPrice(cheapestProduct.price)} from ${cheapestProduct.platform}\n\n` +
            `Available from: ${platforms.join(', ')}\n\n` +
            `How would you like me to further refine these results?`;

          setChatMessages([
            ...currentMessages,
            { role: 'assistant' as const, content: response }
          ]);

          return;
        }

        // If we didn't find any matches, let the user know
        setChatMessages([
          ...currentMessages,
          { role: 'assistant' as const, content: `I couldn't find any items matching "${searchQuery}" in the current results. Would you like me to try a different filter or search term?` }
        ]);

        return;
      }

      // Only if we don't have any existing results, suggest a search
      setChatMessages([
        ...currentMessages,
        { role: 'assistant' as const, content: `I don't have any search results to filter yet. Would you like me to search for "${searchQuery}"?` }
      ]);

      return;
    }

      // ADVANCED PRICE FILTER INTENT
      else if (
        lowerInput.includes('under $') ||
        lowerInput.includes('less than $') ||
        lowerInput.includes('cheaper than') ||
        lowerInput.includes('max price') ||
        lowerInput.includes('maximum price') ||
        lowerInput.includes('over $') ||
        lowerInput.includes('more than $') ||
        lowerInput.includes('between $') ||
        lowerInput.includes('price range') ||
        lowerInput.includes('around $')
      ) {
        // Extract price information using more advanced patterns
        let minPrice: number | null = null;
        let maxPrice: number | null = null;

        // Check for price range (between X and Y)
        const rangeMatch = input.match(/between\s+\$?(\d+)\s+and\s+\$?(\d+)/i);
        if (rangeMatch && rangeMatch[1] && rangeMatch[2]) {
          minPrice = parseInt(rangeMatch[1]);
          maxPrice = parseInt(rangeMatch[2]);
        }
        // Check for "around $X" (create a range around the value)
        else if (lowerInput.includes('around $')) {
          const aroundMatch = input.match(/around\s+\$?(\d+)/i);
          if (aroundMatch && aroundMatch[1]) {
            const centerPrice = parseInt(aroundMatch[1]);
            if (!isNaN(centerPrice)) {
              // Create a range of ±20% around the center price
              minPrice = Math.floor(centerPrice * 0.8);
              maxPrice = Math.ceil(centerPrice * 1.2);
            }
          }
        }
        // Check for maximum price
        else if (
          lowerInput.includes('under $') ||
          lowerInput.includes('less than $') ||
          lowerInput.includes('cheaper than') ||
          lowerInput.includes('max price') ||
          lowerInput.includes('maximum price')
        ) {
          const maxMatch = input.match(/\$(\d+)/);
          if (maxMatch && maxMatch[1]) {
            maxPrice = parseInt(maxMatch[1]);
          }
        }
        // Check for minimum price
        else if (
          lowerInput.includes('over $') ||
          lowerInput.includes('more than $') ||
          lowerInput.includes('minimum price') ||
          lowerInput.includes('min price')
        ) {
          const minMatch = input.match(/\$(\d+)/);
          if (minMatch && minMatch[1]) {
            minPrice = parseInt(minMatch[1]);
          }
        }

        // Apply the filters if we have valid price constraints
        if ((minPrice !== null || maxPrice !== null) && setFilters) {
          const newFilters = { ...filters };

          if (minPrice !== null && !isNaN(minPrice)) {
            newFilters.minPrice = minPrice;
          }

          if (maxPrice !== null && !isNaN(maxPrice)) {
            newFilters.maxPrice = maxPrice;
          }

          // Apply the filters
          setFilters(newFilters);

          // Check if we have products to filter
          if (originalProducts.length > 0) {
            // Apply the price filters
            let filteredProducts = [...originalProducts];

            if (minPrice !== null && !isNaN(minPrice)) {
              filteredProducts = filteredProducts.filter(product => product.price >= minPrice!);
            }

            if (maxPrice !== null && !isNaN(maxPrice)) {
              filteredProducts = filteredProducts.filter(product => product.price <= maxPrice!);
            }

            setProducts(filteredProducts);

            // Generate a detailed response about the filtered products
            if (filteredProducts.length > 0) {
              // Sort by price
              const sortedProducts = [...filteredProducts].sort((a, b) => a.price - b.price);
              const cheapestProduct = sortedProducts[0];
              const expensiveProduct = sortedProducts[sortedProducts.length - 1];

              // Get platform distribution
              const platformCounts: {[key: string]: number} = {};
              filteredProducts.forEach(p => {
                platformCounts[p.platform] = (platformCounts[p.platform] || 0) + 1;
              });

              // Sort platforms by count
              const platforms = Object.entries(platformCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([platform, count]) => `${platform} (${count})`);

              // Calculate average price
              const avgPrice = filteredProducts.reduce((sum, p) => sum + p.price, 0) / filteredProducts.length;

              // Build the response
              let priceRangeDescription = '';
              if (minPrice !== null && maxPrice !== null) {
                priceRangeDescription = `between ${formatPrice(minPrice)} and ${formatPrice(maxPrice)}`;
              } else if (minPrice !== null) {
                priceRangeDescription = `over ${formatPrice(minPrice)}`;
              } else if (maxPrice !== null) {
                priceRangeDescription = `under ${formatPrice(maxPrice)}`;
              }

              const response = `I found ${filteredProducts.length} items ${priceRangeDescription}.\n\n` +
                `Price range: ${formatPrice(cheapestProduct.price)} to ${formatPrice(expensiveProduct.price)}, average: ${formatPrice(avgPrice)}\n\n` +
                `Best budget option: ${cheapestProduct.title} at ${formatPrice(cheapestProduct.price)} from ${cheapestProduct.platform}\n\n` +
                `Available from: ${platforms.join(', ')}\n\n` +
                `Would you like me to further refine these results?`;

              setChatMessages([
                ...currentMessages,
                { role: 'assistant' as const, content: response }
              ]);

              // Update URL
              const url = new URL(window.location.href);
              if (minPrice !== null) url.searchParams.set('minPrice', minPrice.toString());
              if (maxPrice !== null) url.searchParams.set('maxPrice', maxPrice.toString());
              window.history.pushState({}, '', url);
            } else {
              // No products match the filter
              let priceRangeDescription = '';
              if (minPrice !== null && maxPrice !== null) {
                priceRangeDescription = `between ${formatPrice(minPrice)} and ${formatPrice(maxPrice)}`;
              } else if (minPrice !== null) {
                priceRangeDescription = `over ${formatPrice(minPrice)}`;
              } else if (maxPrice !== null) {
                priceRangeDescription = `under ${formatPrice(maxPrice)}`;
              }

              const response = `I couldn't find any items ${priceRangeDescription} in the current results. Would you like me to search for something else or adjust the price range?`;

              setChatMessages([
                ...currentMessages,
                { role: 'assistant' as const, content: response }
              ]);
            }

            return;
          } else {
            // No products to filter - suggest a search
            let priceRangeDescription = '';
            if (minPrice !== null && maxPrice !== null) {
              priceRangeDescription = `between ${formatPrice(minPrice)} and ${formatPrice(maxPrice)}`;
            } else if (minPrice !== null) {
              priceRangeDescription = `over ${formatPrice(minPrice)}`;
            } else if (maxPrice !== null) {
              priceRangeDescription = `under ${formatPrice(maxPrice)}`;
            }

            const response = `I don't have any search results to filter yet. Would you like me to search for products ${priceRangeDescription}?`;

            setChatMessages([
              ...currentMessages,
              { role: 'assistant' as const, content: response }
            ]);

            return;
          }
        }
      }

      // SORT INTENT - User wants to sort results
      else if (
        lowerInput.includes('sort by') ||
        lowerInput.includes('order by') ||
        lowerInput.includes('cheapest') ||
        lowerInput.includes('lowest price') ||
        lowerInput.includes('highest price') ||
        lowerInput.includes('most expensive') ||
        lowerInput.includes('newest') ||
        lowerInput.includes('popular')
      ) {
        let newSortType = '';

        if (lowerInput.includes('cheapest') || lowerInput.includes('lowest price')) {
          newSortType = 'cheapest';
        } else if (lowerInput.includes('highest price') || lowerInput.includes('most expensive')) {
          newSortType = 'expensive';
        } else if (lowerInput.includes('newest')) {
          newSortType = 'newest';
        } else if (lowerInput.includes('popular')) {
          newSortType = 'popular';
        }

        if (newSortType && setSearchType) {
          // Apply the sort
          setSearchType(newSortType);

          // Respond with the sort action
          let response = '';
          switch (newSortType) {
            case 'cheapest':
              response = "I've sorted the results by lowest price first.";
              break;
            case 'expensive':
              response = "I've sorted the results by highest price first.";
              break;
            case 'newest':
              response = "I've sorted the results to show the newest items first.";
              break;
            case 'popular':
              response = "I've sorted the results to show the most popular items first.";
              break;
          }

          setChatMessages([
            ...currentMessages,
            { role: 'assistant' as const, content: response }
          ]);

          // Trigger a new search with the sort type
          if (searchQuery) {
            handleSearchWithQuery(searchQuery);
          }

          return;
        }
      }

      // PLATFORM FILTER INTENT
      else if (
        lowerInput.includes('from lazada') ||
        lowerInput.includes('on lazada') ||
        lowerInput.includes('from zalora') ||
        lowerInput.includes('on zalora') ||
        lowerInput.includes('from shein') ||
        lowerInput.includes('on shein') ||
        lowerInput.includes('from shopee') ||
        lowerInput.includes('on shopee')
      ) {
        let platform = '';

        if (lowerInput.includes('lazada')) {
          platform = 'Lazada';
        } else if (lowerInput.includes('zalora')) {
          platform = 'Zalora';
        } else if (lowerInput.includes('shein')) {
          platform = 'Shein';
        } else if (lowerInput.includes('shopee')) {
          platform = 'Shopee';
        }

        if (platform && setFilters) {
          // Apply the platform filter
          setFilters({
            ...filters,
            platform: platform
          });

          // Filter the products
          if (originalProducts.length > 0) {
            const filteredProducts = originalProducts.filter(product =>
              product.platform.toLowerCase().includes(platform.toLowerCase())
            );

            setProducts(filteredProducts);

            // Respond with the filter results
            const response = `I've filtered the results to show only items from ${platform}. Found ${filteredProducts.length} items.`;

            setChatMessages([
              ...currentMessages,
              { role: 'assistant' as const, content: response }
            ]);

            // Update URL
            const url = new URL(window.location.href);
            url.searchParams.set('platform', platform);
            window.history.pushState({}, '', url);

            return;
          }
        }
      }

      // REFRESH INTENT - User wants fresh results
      else if (
        lowerInput.includes('refresh') ||
        lowerInput.includes('update') ||
        lowerInput.includes('new results') ||
        lowerInput.includes('fresh results')
      ) {
        // Respond that we're refreshing
        const response = "I'll get fresh results for you right away.";

        setChatMessages([
          ...currentMessages,
          { role: 'assistant' as const, content: response }
        ]);

        // Perform a fresh search
        if (searchQuery) {
          // Clear the lastSearchQuery to force a fresh search
          localStorage.removeItem('lastSearchQuery');

          // Trigger a new search
          handleSearchWithQuery(searchQuery);
        }

        return;
      }

      // DEFAULT RESPONSES - If no specific intent is matched
      let response = '';

      // Check if we have products to analyze
      if (products.length > 0) {
        // Analyze the products more deeply
        const prices = products.map(p => p.price);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;

        // Get platform distribution
        const platformCounts: {[key: string]: number} = {};
        products.forEach(p => {
          platformCounts[p.platform] = (platformCounts[p.platform] || 0) + 1;
        });

        // Sort platforms by count
        const platforms = Object.entries(platformCounts)
          .sort((a, b) => b[1] - a[1])
          .map(([platform]) => platform);

        // Sort products by price
        const sortedByPrice = [...products].sort((a, b) => a.price - b.price);
        const cheapestProduct = sortedByPrice[0];
        const expensiveProduct = sortedByPrice[sortedByPrice.length - 1];

        // Extract common categories/keywords from titles
        const words = products.flatMap(p =>
          p.title.toLowerCase().split(/\s+/).filter(word => word.length > 3)
        );
        const wordCounts: {[key: string]: number} = {};
        words.forEach(word => {
          wordCounts[word] = (wordCounts[word] || 0) + 1;
        });

        // Get top keywords
        const topKeywords = Object.entries(wordCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([word]) => word);

        if (lowerInput.includes('best') || lowerInput.includes('recommend')) {
          // Provide detailed recommendations
          response = `Based on analyzing all ${products.length} items, I recommend:\n\n` +
            `Budget option: ${cheapestProduct.title} (${cheapestProduct.platform}) at ${formatPrice(cheapestProduct.price)}\n\n` +
            `Premium option: ${expensiveProduct.title} (${expensiveProduct.platform}) at ${formatPrice(expensiveProduct.price)}\n\n` +
            `Most items are from ${platforms[0]}. Would you like me to filter by a specific platform or price range?`;
        }
        else if (lowerInput.includes('price') || lowerInput.includes('cheap') || lowerInput.includes('expensive')) {
          // Detailed price analysis
          const under50 = products.filter(p => p.price < 50).length;
          const under100 = products.filter(p => p.price < 100 && p.price >= 50).length;
          const over100 = products.filter(p => p.price >= 100).length;

          response = `Price analysis of ${products.length} items:\n\n` +
            `• Range: ${formatPrice(minPrice)} to ${formatPrice(maxPrice)}\n` +
            `• Average: ${formatPrice(avgPrice)}\n` +
            `• ${under50} items under ${formatPrice(50)}\n` +
            `• ${under100} items between ${formatPrice(50)}-${formatPrice(100)}\n` +
            `• ${over100} items over ${formatPrice(100)}\n\n` +
            `Would you like me to filter to a specific price range?`;
        }
        else if (lowerInput.includes('difference') || lowerInput.includes('compare')) {
          // Detailed comparison
          const platformPrices: {[key: string]: number[]} = {};
          products.forEach(p => {
            if (!platformPrices[p.platform]) platformPrices[p.platform] = [];
            platformPrices[p.platform].push(p.price);
          });

          let platformComparison = '';
          Object.entries(platformPrices).forEach(([platform, prices]) => {
            const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
            platformComparison += `• ${platform}: ${prices.length} items, avg price ${formatPrice(avgPrice)}\n`;
          });

          response = `Comparison across ${platforms.length} platforms:\n\n${platformComparison}\n` +
            `Common features: ${topKeywords.join(', ')}\n\n` +
            `Would you like me to filter to a specific platform?`;
        }
        else if (lowerInput.includes('help')) {
          response = `I can help you analyze these ${products.length} items in detail. Try asking me:\n\n` +
            `• "What's the cheapest option?"\n` +
            `• "Show me items under ${formatPrice(50)}"\n` +
            `• "Compare prices across platforms"\n` +
            `• "Filter to only show Shein products"\n` +
            `• "Sort by newest first"`;
        }
        else {
          // General analysis
          response = `I've analyzed all ${products.length} items across ${platforms.length} platforms (${platforms.join(', ')}).\n\n` +
            `Prices range from ${formatPrice(minPrice)} to ${formatPrice(maxPrice)}.\n\n` +
            `Popular features include: ${topKeywords.join(', ')}.\n\n` +
            `How would you like me to help narrow down these results?`;
        }
      } else {
        // No products to analyze - suggest searches
        if (lowerInput.includes('help')) {
          response = `I can help you find products across Lazada, Shein, Zalora, and Shopee. Try:\n\n` +
            `• "Find women's dresses"\n` +
            `• "Search for men's shoes"\n` +
            `• "Show me casual outfits"\n` +
            `• "Look for summer clothes"`;
        } else {
          // Try to suggest a search based on the input
          const suggestSearch = () => {
            const fashionTerms = ['clothes', 'fashion', 'outfit', 'style', 'wear', 'dress'];
            for (const term of fashionTerms) {
              if (lowerInput.includes(term)) {
                return `Would you like me to search for trending ${term}?`;
              }
            }
            return `What would you like to search for? Try asking for specific items like "shoes" or "dresses".`;
          };

          response = suggestSearch();
        }
      }

      // Send response immediately without delay
      setChatMessages([
        ...currentMessages,
        { role: 'assistant' as const, content: response }
      ]);
  };

  // Handle feedback on suggestions
  const handleFeedback = (item: string, type: 'up' | 'down') => {
    setFeedbackGiven(prev => ({
      ...prev,
      [item]: type
    }));

    // In a real app, this would be sent to an API to improve suggestions
    console.log(`Feedback given for "${item}": ${type}`);
  };

  const applyFilter = (filterType: string, value: any) => {
    // If we don't have original products, we can't filter
    if (originalProducts.length === 0) {
      // Add a message to the chat about needing to search first
      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: "I need some search results first before I can apply filters. Try searching for a product."
        }
      ]);
      return;
    }

    // Filter the products based on the filter type and value
    let filteredProducts = [...originalProducts];
    let filterDescription = '';

    if (filterType === 'category' && typeof value === 'string') {
      const lowerCategory = value.toLowerCase();
      filteredProducts = filteredProducts.filter(product => {
        const title = product.title.toLowerCase();
        const description = product.description?.toLowerCase() || '';
        const category = product.category?.toLowerCase() || '';

        return title.includes(lowerCategory) ||
               description.includes(lowerCategory) ||
               category.includes(lowerCategory);
      });

      // Update URL without page reload
      const url = new URL(window.location.href);
      const currentQuery = url.searchParams.get('q') || '';
      const updatedQuery = currentQuery ? `${currentQuery} ${value}` : value;
      url.searchParams.set('q', updatedQuery);
      window.history.pushState({}, '', url);

      // Update the search query in the UI
      setSearchQuery(updatedQuery);

      // Store the current search query for refresh button comparison
      localStorage.setItem('lastSearchQuery', updatedQuery);

      filterDescription = `category "${value}"`;

      // Update filters if available
      if (setFilters) {
        setFilters({
          ...filters,
          category: value
        });
      }
    }
    else if (filterType === 'price' && typeof value === 'string') {
      // Parse the price string (e.g., "Max $100")
      if (value.toLowerCase().includes('max')) {
        const maxPrice = parseInt(value.replace(/[^0-9]/g, ''));
        if (!isNaN(maxPrice)) {
          filteredProducts = filteredProducts.filter(product =>
            product.price <= maxPrice
          );

          // Update URL without page reload
          const url = new URL(window.location.href);
          url.searchParams.set('maxPrice', maxPrice.toString());
          window.history.pushState({}, '', url);

          filterDescription = `price under $${maxPrice}`;

          // Update filters if available
          if (setFilters) {
            setFilters({
              ...filters,
              maxPrice: maxPrice
            });
          }
        }
      }
    }
    else if (filterType === 'maxPrice' && typeof value === 'number') {
      filteredProducts = filteredProducts.filter(product =>
        product.price <= value
      );

      // Update URL without page reload
      const url = new URL(window.location.href);
      url.searchParams.set('maxPrice', value.toString());
      window.history.pushState({}, '', url);

      filterDescription = `price under $${value}`;

      // Update filters if available
      if (setFilters) {
        setFilters({
          ...filters,
          maxPrice: value
        });
      }
    }
    else if (filterType === 'minPrice' && typeof value === 'number') {
      filteredProducts = filteredProducts.filter(product =>
        product.price >= value
      );

      // Update URL without page reload
      const url = new URL(window.location.href);
      url.searchParams.set('minPrice', value.toString());
      window.history.pushState({}, '', url);

      filterDescription = `price above $${value}`;

      // Update filters if available
      if (setFilters) {
        setFilters({
          ...filters,
          minPrice: value
        });
      }
    }
    else if (filterType === 'brand' && typeof value === 'string') {
      const lowerBrand = value.toLowerCase();
      filteredProducts = filteredProducts.filter(product => {
        const title = product.title.toLowerCase();
        const description = product.description?.toLowerCase() || '';
        const brand = product.brand?.toLowerCase() || '';

        return title.includes(lowerBrand) ||
               description.includes(lowerBrand) ||
               brand.includes(lowerBrand);
      });

      // Update URL without page reload
      const url = new URL(window.location.href);
      url.searchParams.set('brand', value);
      window.history.pushState({}, '', url);

      filterDescription = `brand "${value}"`;

      // Update filters if available
      if (setFilters) {
        setFilters({
          ...filters,
          brand: value
        });
      }
    }

    // Update the products state with the filtered products
    setProducts(filteredProducts);

    // Add a message to the chat about the filter
    if (filterDescription) {
      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `I've filtered the results by ${filterDescription}. Found ${filteredProducts.length} matching items.`
        }
      ]);
    }
  };

  return (
    <div className="bg-indigo-950/50 rounded-lg shadow-md border border-purple-500/30 p-4 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-pink-400" />
        <h2 className="text-lg font-semibold text-white">AI Shopping Assistant</h2>
      </div>

      {!currentQuery ? (
        <div className="space-y-4">
          <p className="text-sm text-purple-200">
            Enter a search query to get AI-powered suggestions and insights.
          </p>

          {/* Trending searches */}
          {trendingSearches.length > 0 && (
            <div>
              <div className="flex items-center gap-1 mb-2">
                <TrendingUp className="h-4 w-4 text-pink-400" />
                <h3 className="text-sm font-medium text-pink-400">Trending Searches</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {trendingSearches.map((search, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="cursor-pointer hover:bg-purple-800/50 border-purple-500/30 text-white hover:text-pink-300 bg-indigo-900/70"
                    onClick={() => handleSuggestedSearch(search)}
                  >
                    {search}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Recent searches */}
          {recentSearches.length > 0 && (
            <div>
              <div className="flex items-center gap-1 mb-2">
                <Clock className="h-4 w-4 text-pink-400" />
                <h3 className="text-sm font-medium text-pink-400">Recent Searches</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {recentSearches.slice(0, 5).map((search, index) => (
                  <Badge
                    key={index}
                    className="cursor-pointer bg-pink-500/40 hover:bg-pink-500/50 text-white hover:text-white"
                    onClick={() => handleSuggestedSearch(search)}
                  >
                    {search}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-indigo-900/50 border border-purple-500/30">
            <TabsTrigger value="suggestions" className="text-xs data-[state=active]:bg-pink-500 data-[state=active]:text-white data-[state=inactive]:text-purple-200 data-[state=inactive]:hover:text-pink-300">
              <Search className="h-3.5 w-3.5 mr-1" />
              Suggestions
            </TabsTrigger>
            <TabsTrigger value="insights" className="text-xs data-[state=active]:bg-pink-500 data-[state=active]:text-white data-[state=inactive]:text-purple-200 data-[state=inactive]:hover:text-pink-300">
              <Sparkles className="h-3.5 w-3.5 mr-1" />
              Insights
            </TabsTrigger>
            <TabsTrigger value="chat" className="text-xs data-[state=active]:bg-pink-500 data-[state=active]:text-white data-[state=inactive]:text-purple-200 data-[state=inactive]:hover:text-pink-300">
              <MessageSquare className="h-3.5 w-3.5 mr-1" />
              Chat
            </TabsTrigger>
          </TabsList>

          {/* Suggestions Tab */}
          <TabsContent value="suggestions" className="space-y-4 mt-2">
            {suggestedSearches.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2 text-pink-400 bg-indigo-900/50 p-2 rounded-md">Suggested Searches:</h3>
                <div className="flex flex-wrap gap-2">
                  {suggestedSearches.map((search, index) => (
                    <div key={index} className="flex flex-col items-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSuggestedSearch(search)}
                        className="h-auto py-1 px-3 text-xs rounded-full border-purple-500/30 text-white hover:bg-purple-800/50 hover:text-pink-300 bg-indigo-900/70"
                      >
                        {search}
                      </Button>

                      {/* Feedback buttons */}
                      <div className="flex mt-1 bg-indigo-900/50 rounded-full px-1">
                        <button
                          onClick={() => handleFeedback(search, 'up')}
                          className={`p-1 rounded-full ${feedbackGiven[search] === 'up' ? 'text-green-400' : 'text-pink-400 hover:text-pink-300'}`}
                          aria-label="Helpful suggestion"
                        >
                          <ThumbsUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => handleFeedback(search, 'down')}
                          className={`p-1 rounded-full ${feedbackGiven[search] === 'down' ? 'text-red-400' : 'text-pink-400 hover:text-pink-300'}`}
                          aria-label="Not helpful suggestion"
                        >
                          <ThumbsDown className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Object.keys(suggestedFilters).length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2 text-pink-400">Suggested Filters:</h3>
                <div className="space-y-2">
                  {suggestedFilters.category && (
                    <div className="flex items-center">
                      <Tag className="h-3.5 w-3.5 mr-2 text-pink-400" />
                      <span className="text-xs font-medium text-white">Category:</span>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => applyFilter('category', suggestedFilters.category)}
                        className="h-auto p-0 ml-1 text-xs text-pink-300 hover:text-pink-200"
                      >
                        {suggestedFilters.category}
                      </Button>
                    </div>
                  )}
                  {suggestedFilters.price && (
                    <div className="flex items-center">
                      <Tag className="h-3.5 w-3.5 mr-2 text-pink-400" />
                      <span className="text-xs font-medium text-white">Price:</span>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => applyFilter('price', suggestedFilters.price)}
                        className="h-auto p-0 ml-1 text-xs text-pink-300 hover:text-pink-200"
                      >
                        {suggestedFilters.price}
                      </Button>
                    </div>
                  )}
                  {suggestedFilters.brand && (
                    <div className="flex items-center">
                      <Tag className="h-3.5 w-3.5 mr-2 text-pink-400" />
                      <span className="text-xs font-medium text-white">Brand:</span>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => applyFilter('brand', suggestedFilters.brand)}
                        className="h-auto p-0 ml-1 text-xs text-pink-300 hover:text-pink-200"
                      >
                        {suggestedFilters.brand}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Reset filters button */}
            {originalProducts.length > 0 && products.length !== originalProducts.length && (
              <div className="pt-2 border-t border-purple-500/30">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Reset to original products
                    setProducts(originalProducts);

                    // Reset URL parameters except for the query
                    const url = new URL(window.location.href);
                    const query = url.searchParams.get('q');
                    url.search = query ? `?q=${query}` : '';
                    window.history.pushState({}, '', url);
                  }}
                  className="h-8 text-xs w-full justify-start text-purple-200 hover:text-pink-300 hover:bg-purple-800/50"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-2 text-pink-400" />
                  Reset All Filters
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-4 mt-2">
            {isAnalyzing ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-400 mb-2"></div>
                <p className="text-sm text-purple-200">Analyzing products...</p>
              </div>
            ) : productInsights.length > 0 ? (
              <div className="space-y-3">
                {productInsights.map((insight, index) => (
                  <div key={index} className="bg-purple-800/20 border border-purple-500/30 rounded-lg p-3">
                    <p className="text-sm text-white">{insight}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-purple-200 py-4 text-center">
                No insights available. Try searching for products first.
              </p>
            )}
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat" className="mt-2">
            <div className="flex flex-col h-[300px]">
              <div className="flex-1 overflow-y-auto mb-3 space-y-3">
                {chatMessages.length > 0 ? (
                  chatMessages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                          message.role === 'user'
                            ? 'bg-pink-500 text-white'
                            : 'bg-purple-800/20 border border-purple-500/30 text-white'
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-purple-200">
                      Ask me anything about these products!
                    </p>
                  </div>
                )}
              </div>

              <form onSubmit={handleChatSubmit} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Ask about these products..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-1 text-sm bg-white/10 border-purple-500/30 text-white placeholder:text-purple-300/50 focus:border-pink-400 focus:ring-pink-400/20"
                />
                <Button type="submit" size="sm" className="shrink-0 bg-pink-500 hover:bg-pink-600 text-white">
                  <MessageSquare className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
