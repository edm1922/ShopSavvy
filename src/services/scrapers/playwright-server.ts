/**
 * Server-only Playwright imports.
 * 
 * This file should only be imported in server components or API routes.
 * It provides a way to use Playwright without causing client-side build errors.
 */

// Dynamic import to avoid client-side bundling issues
export const getPlaywright = async () => {
  // Only import Playwright on the server
  if (typeof window === 'undefined') {
    const { chromium, firefox, webkit } = await import('playwright');
    return { chromium, firefox, webkit };
  }
  
  // Return mock implementations for client-side
  return {
    chromium: {
      launch: () => Promise.resolve(null),
    },
    firefox: {
      launch: () => Promise.resolve(null),
    },
    webkit: {
      launch: () => Promise.resolve(null),
    },
  };
};

// Helper function to check if we're on the server
export const isServer = typeof window === 'undefined';
