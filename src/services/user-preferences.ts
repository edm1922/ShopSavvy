/**
 * User preferences service for storing and retrieving user preferences
 * Uses localStorage for persistence
 */

// Define the structure of user preferences
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  savedFilters: SavedFilter[];
  favoriteProducts: string[]; // Array of product IDs
  searchHistory: string[];
  recentlyViewed: string[]; // Array of product IDs
  accessibility: {
    highContrast: boolean;
    reducedMotion: boolean;
    largeText: boolean;
  };
}

// Define the structure of a saved filter
export interface SavedFilter {
  id: string;
  name: string;
  query: string;
  filters: {
    minPrice?: number;
    maxPrice?: number;
    brand?: string;
    category?: string;
    platform?: string;
  };
  createdAt: number; // Timestamp
}

// Default user preferences
const defaultPreferences: UserPreferences = {
  theme: 'system',
  savedFilters: [],
  favoriteProducts: [],
  searchHistory: [],
  recentlyViewed: [],
  accessibility: {
    highContrast: false,
    reducedMotion: false,
    largeText: false,
  },
};

// Storage key for user preferences
const STORAGE_KEY = 'shopsavvy_user_preferences';

/**
 * Get user preferences from localStorage
 * @returns User preferences object
 */
export function getUserPreferences(): UserPreferences {
  try {
    const storedPreferences = localStorage.getItem(STORAGE_KEY);
    if (!storedPreferences) {
      return defaultPreferences;
    }
    
    const parsedPreferences = JSON.parse(storedPreferences);
    return { ...defaultPreferences, ...parsedPreferences };
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return defaultPreferences;
  }
}

/**
 * Save user preferences to localStorage
 * @param preferences User preferences object
 */
export function saveUserPreferences(preferences: Partial<UserPreferences>): void {
  try {
    const currentPreferences = getUserPreferences();
    const updatedPreferences = { ...currentPreferences, ...preferences };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPreferences));
  } catch (error) {
    console.error('Error saving user preferences:', error);
  }
}

/**
 * Update a specific user preference
 * @param key Preference key
 * @param value Preference value
 */
export function updateUserPreference<K extends keyof UserPreferences>(
  key: K,
  value: UserPreferences[K]
): void {
  try {
    const currentPreferences = getUserPreferences();
    const updatedPreferences = { ...currentPreferences, [key]: value };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPreferences));
  } catch (error) {
    console.error(`Error updating user preference "${key}":`, error);
  }
}

/**
 * Add a product to favorites
 * @param productId Product ID
 */
export function addFavoriteProduct(productId: string): void {
  try {
    const currentPreferences = getUserPreferences();
    if (!currentPreferences.favoriteProducts.includes(productId)) {
      const updatedFavorites = [...currentPreferences.favoriteProducts, productId];
      updateUserPreference('favoriteProducts', updatedFavorites);
    }
  } catch (error) {
    console.error('Error adding favorite product:', error);
  }
}

/**
 * Remove a product from favorites
 * @param productId Product ID
 */
export function removeFavoriteProduct(productId: string): void {
  try {
    const currentPreferences = getUserPreferences();
    const updatedFavorites = currentPreferences.favoriteProducts.filter(id => id !== productId);
    updateUserPreference('favoriteProducts', updatedFavorites);
  } catch (error) {
    console.error('Error removing favorite product:', error);
  }
}

/**
 * Check if a product is in favorites
 * @param productId Product ID
 * @returns True if the product is in favorites
 */
export function isProductFavorite(productId: string): boolean {
  try {
    const currentPreferences = getUserPreferences();
    return currentPreferences.favoriteProducts.includes(productId);
  } catch (error) {
    console.error('Error checking if product is favorite:', error);
    return false;
  }
}

/**
 * Save a filter configuration
 * @param name Filter name
 * @param query Search query
 * @param filters Filter configuration
 */
export function saveFilter(
  name: string,
  query: string,
  filters: SavedFilter['filters']
): void {
  try {
    const currentPreferences = getUserPreferences();
    const newFilter: SavedFilter = {
      id: Date.now().toString(),
      name,
      query,
      filters,
      createdAt: Date.now(),
    };
    
    const updatedFilters = [...currentPreferences.savedFilters, newFilter];
    updateUserPreference('savedFilters', updatedFilters);
  } catch (error) {
    console.error('Error saving filter:', error);
  }
}

/**
 * Delete a saved filter
 * @param filterId Filter ID
 */
export function deleteFilter(filterId: string): void {
  try {
    const currentPreferences = getUserPreferences();
    const updatedFilters = currentPreferences.savedFilters.filter(
      filter => filter.id !== filterId
    );
    updateUserPreference('savedFilters', updatedFilters);
  } catch (error) {
    console.error('Error deleting filter:', error);
  }
}

/**
 * Add a search query to search history
 * @param query Search query
 * @param maxHistory Maximum number of search queries to keep
 */
export function addToSearchHistory(query: string, maxHistory: number = 10): void {
  try {
    const currentPreferences = getUserPreferences();
    
    // Remove the query if it already exists to avoid duplicates
    const filteredHistory = currentPreferences.searchHistory.filter(q => q !== query);
    
    // Add the new query to the beginning of the array
    const updatedHistory = [query, ...filteredHistory].slice(0, maxHistory);
    
    updateUserPreference('searchHistory', updatedHistory);
  } catch (error) {
    console.error('Error adding to search history:', error);
  }
}

/**
 * Clear search history
 */
export function clearSearchHistory(): void {
  try {
    updateUserPreference('searchHistory', []);
  } catch (error) {
    console.error('Error clearing search history:', error);
  }
}

/**
 * Add a product to recently viewed
 * @param productId Product ID
 * @param maxRecent Maximum number of recently viewed products to keep
 */
export function addToRecentlyViewed(productId: string, maxRecent: number = 20): void {
  try {
    const currentPreferences = getUserPreferences();
    
    // Remove the product if it already exists to avoid duplicates
    const filteredRecent = currentPreferences.recentlyViewed.filter(id => id !== productId);
    
    // Add the new product to the beginning of the array
    const updatedRecent = [productId, ...filteredRecent].slice(0, maxRecent);
    
    updateUserPreference('recentlyViewed', updatedRecent);
  } catch (error) {
    console.error('Error adding to recently viewed:', error);
  }
}
