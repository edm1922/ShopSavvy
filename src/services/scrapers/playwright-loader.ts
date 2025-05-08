/**
 * Dynamic loader for Playwright.
 * 
 * This file provides a way to dynamically import Playwright only on the server side.
 * It ensures that Playwright is never included in the client-side bundle.
 */

// Type definitions for the Playwright browser and page
export interface Browser {
  newPage(): Promise<Page>;
  close(): Promise<void>;
}

export interface Page {
  goto(url: string, options?: any): Promise<any>;
  content(): Promise<string>;
  screenshot(options?: any): Promise<Buffer>;
  evaluate(fn: Function, ...args: any[]): Promise<any>;
  waitForSelector(selector: string, options?: any): Promise<any>;
  waitForTimeout(timeout: number): Promise<void>;
  $$(selector: string): Promise<any[]>;
  $(selector: string): Promise<any>;
  close(): Promise<void>;
}

// Check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

/**
 * Dynamically loads Playwright and launches a browser.
 * 
 * @param options Options for launching the browser.
 * @returns A promise that resolves to a browser instance, or null if in a browser environment.
 */
export async function launchBrowser(options: any = {}): Promise<Browser | null> {
  // In the browser, return null
  if (isBrowser) {
    console.warn('Attempted to launch Playwright browser in browser environment');
    return null;
  }
  
  try {
    // Dynamically import Playwright
    const playwright = await import('playwright');
    
    // Launch a browser
    const browser = await playwright.chromium.launch({
      headless: true,
      ...options,
    });
    
    return browser;
  } catch (error) {
    console.error('Error launching Playwright browser:', error);
    return null;
  }
}

/**
 * Creates a mock browser for use in the browser environment.
 * 
 * @returns A mock browser instance.
 */
export function createMockBrowser(): Browser {
  const mockPage: Page = {
    goto: async () => null,
    content: async () => '<html><body>Mock content</body></html>',
    screenshot: async () => Buffer.from(''),
    evaluate: async () => null,
    waitForSelector: async () => null,
    waitForTimeout: async () => {},
    $$: async () => [],
    $: async () => null,
    close: async () => {},
  };
  
  const mockBrowser: Browser = {
    newPage: async () => mockPage,
    close: async () => {},
  };
  
  return mockBrowser;
}
