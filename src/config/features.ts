/**
 * Feature flags for the application.
 */

// Debug log to see the value of the environment variable
console.log('NEXT_PUBLIC_USE_CUSTOM_SCRAPERS:', process.env.NEXT_PUBLIC_USE_CUSTOM_SCRAPERS);

export const FEATURES = {
  /**
   * Whether to use custom scrapers instead of Serper.dev API.
   */
  USE_CUSTOM_SCRAPERS: process.env.NEXT_PUBLIC_USE_CUSTOM_SCRAPERS === 'true'
};

// Debug log to see the value of the feature flag
console.log('FEATURES.USE_CUSTOM_SCRAPERS:', FEATURES.USE_CUSTOM_SCRAPERS);
