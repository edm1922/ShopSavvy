/**
 * Simple analytics service for tracking user behavior
 * Uses localStorage for persistence in this demo version
 * In a production app, this would send data to a backend service
 */

// Define event types
export type EventType = 
  | 'search'
  | 'filter_apply'
  | 'filter_clear'
  | 'product_view'
  | 'product_favorite'
  | 'product_unfavorite'
  | 'page_view'
  | 'ai_suggestion_click'
  | 'ai_chat_message'
  | 'error';

// Define event data structure
export interface AnalyticsEvent {
  type: EventType;
  timestamp: number;
  data: Record<string, any>;
}

// Storage key for analytics events
const STORAGE_KEY = 'shopsavvy_analytics_events';

// Maximum number of events to store locally
const MAX_STORED_EVENTS = 1000;

/**
 * Track an event
 * @param type Event type
 * @param data Event data
 */
export function trackEvent(type: EventType, data: Record<string, any> = {}): void {
  try {
    const event: AnalyticsEvent = {
      type,
      timestamp: Date.now(),
      data,
    };
    
    // In a real app, this would send the event to a backend service
    // For this demo, we'll store it in localStorage
    storeEvent(event);
    
    // Log the event to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Analytics event:', event);
    }
  } catch (error) {
    console.error('Error tracking event:', error);
  }
}

/**
 * Store an event in localStorage
 * @param event Event to store
 */
function storeEvent(event: AnalyticsEvent): void {
  try {
    const storedEvents = getStoredEvents();
    
    // Add the new event
    storedEvents.push(event);
    
    // Limit the number of stored events
    const limitedEvents = storedEvents.slice(-MAX_STORED_EVENTS);
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedEvents));
  } catch (error) {
    console.error('Error storing event:', error);
  }
}

/**
 * Get stored events from localStorage
 * @returns Array of stored events
 */
export function getStoredEvents(): AnalyticsEvent[] {
  try {
    const storedEvents = localStorage.getItem(STORAGE_KEY);
    if (!storedEvents) {
      return [];
    }
    
    return JSON.parse(storedEvents);
  } catch (error) {
    console.error('Error getting stored events:', error);
    return [];
  }
}

/**
 * Clear stored events
 */
export function clearStoredEvents(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing stored events:', error);
  }
}

/**
 * Track a search event
 * @param query Search query
 * @param filters Applied filters
 * @param resultCount Number of results
 */
export function trackSearch(
  query: string,
  filters: Record<string, any> = {},
  resultCount: number = 0
): void {
  trackEvent('search', {
    query,
    filters,
    resultCount,
    timestamp: Date.now(),
  });
}

/**
 * Track a filter apply event
 * @param filters Applied filters
 */
export function trackFilterApply(filters: Record<string, any> = {}): void {
  trackEvent('filter_apply', {
    filters,
    timestamp: Date.now(),
  });
}

/**
 * Track a product view event
 * @param productId Product ID
 * @param productName Product name
 * @param platform Platform
 * @param price Price
 */
export function trackProductView(
  productId: string,
  productName: string,
  platform: string,
  price: number
): void {
  trackEvent('product_view', {
    productId,
    productName,
    platform,
    price,
    timestamp: Date.now(),
  });
}

/**
 * Track a page view event
 * @param path Page path
 * @param title Page title
 */
export function trackPageView(path: string, title: string): void {
  trackEvent('page_view', {
    path,
    title,
    referrer: document.referrer,
    timestamp: Date.now(),
  });
}

/**
 * Track an error event
 * @param message Error message
 * @param source Error source
 * @param stack Error stack trace
 */
export function trackError(
  message: string,
  source: string,
  stack?: string
): void {
  trackEvent('error', {
    message,
    source,
    stack,
    timestamp: Date.now(),
  });
}

/**
 * Get search analytics
 * @returns Search analytics data
 */
export function getSearchAnalytics() {
  const events = getStoredEvents();
  const searchEvents = events.filter(event => event.type === 'search');
  
  // Get top searches
  const searches = searchEvents.map(event => event.data.query);
  const searchCounts: Record<string, number> = {};
  
  searches.forEach(search => {
    if (search) {
      searchCounts[search] = (searchCounts[search] || 0) + 1;
    }
  });
  
  const topSearches = Object.entries(searchCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([query, count]) => ({ query, count }));
  
  // Get average result count
  const resultCounts = searchEvents
    .filter(event => event.data.resultCount !== undefined)
    .map(event => event.data.resultCount);
  
  const averageResultCount = resultCounts.length
    ? resultCounts.reduce((sum, count) => sum + count, 0) / resultCounts.length
    : 0;
  
  return {
    totalSearches: searchEvents.length,
    topSearches,
    averageResultCount,
  };
}
