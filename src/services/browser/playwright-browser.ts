/**
 * Utility functions for creating and managing Playwright browser instances.
 * 
 * This file provides a consistent way to create browser instances with
 * anti-detection settings across different scrapers.
 */

import { chromium, Browser, BrowserContext, Page } from 'playwright';

/**
 * Creates a new Playwright browser instance with anti-detection settings.
 * 
 * @param options Optional browser launch options.
 * @returns A promise that resolves to a Playwright browser instance.
 */
export async function createPlaywrightBrowser(options?: {
  headless?: boolean;
  debug?: boolean;
}): Promise<Browser> {
  const headless = options?.headless !== false; // Default to true
  const debug = options?.debug || false;
  
  if (debug) console.log('[PlaywrightBrowser] Creating browser instance...');
  
  // Launch browser with anti-detection arguments
  const browser = await chromium.launch({
    headless,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-site-isolation-trials',
      '--disable-web-security',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu',
      '--hide-scrollbars',
      '--mute-audio'
    ]
  });
  
  if (debug) console.log('[PlaywrightBrowser] Browser instance created successfully');
  
  return browser;
}

/**
 * Creates a new browser context with stealth settings to avoid detection.
 * 
 * @param browser The Playwright browser instance.
 * @param options Optional context creation options.
 * @returns A promise that resolves to a Playwright browser context.
 */
export async function createStealthContext(
  browser: Browser,
  options?: {
    userAgent?: string;
    debug?: boolean;
  }
): Promise<BrowserContext> {
  const debug = options?.debug || false;
  const userAgent = options?.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';
  
  if (debug) console.log('[PlaywrightBrowser] Creating stealth context...');
  
  // Create a context with stealth settings
  const context = await browser.newContext({
    userAgent,
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    hasTouch: false,
    isMobile: false,
    javaScriptEnabled: true,
    locale: 'en-US',
    timezoneId: 'Asia/Manila',
    permissions: ['geolocation'],
    colorScheme: 'light',
    bypassCSP: true,
    ignoreHTTPSErrors: true,
  });
  
  // Add script to evade detection
  await context.addInitScript(() => {
    // Override the navigator properties
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    
    // Override the permissions
    if (navigator.permissions) {
      const originalQuery = navigator.permissions.query;
      navigator.permissions.query = (parameters: any) => (
        parameters.name === 'notifications' 
          ? Promise.resolve({ state: Notification.permission }) as any
          : originalQuery(parameters)
      );
    }
    
    // Override WebGL vendor and renderer
    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(parameter: any) {
      // UNMASKED_VENDOR_WEBGL
      if (parameter === 37445) {
        return 'Intel Inc.';
      }
      // UNMASKED_RENDERER_WEBGL
      if (parameter === 37446) {
        return 'Intel Iris OpenGL Engine';
      }
      return getParameter.apply(this, [parameter]);
    };
  });
  
  if (debug) console.log('[PlaywrightBrowser] Stealth context created successfully');
  
  return context;
}

/**
 * Creates a new page with resource blocking for faster scraping.
 * 
 * @param context The Playwright browser context.
 * @param options Optional page creation options.
 * @returns A promise that resolves to a Playwright page.
 */
export async function createFastPage(
  context: BrowserContext,
  options?: {
    blockResources?: boolean;
    debug?: boolean;
  }
): Promise<Page> {
  const debug = options?.debug || false;
  const blockResources = options?.blockResources !== false; // Default to true
  
  if (debug) console.log('[PlaywrightBrowser] Creating fast page...');
  
  const page = await context.newPage();
  
  // Block unnecessary resources to speed up scraping
  if (blockResources) {
    await page.route('**/*.{png,jpg,jpeg,gif,svg,css,woff,woff2,ttf,otf}', route => {
      route.abort();
    });
    
    if (debug) console.log('[PlaywrightBrowser] Resource blocking enabled');
  }
  
  if (debug) console.log('[PlaywrightBrowser] Fast page created successfully');
  
  return page;
}

/**
 * Creates a complete stealth page ready for scraping.
 * 
 * @param options Optional creation options.
 * @returns A promise that resolves to a Playwright page.
 */
export async function createStealthPage(options?: {
  headless?: boolean;
  userAgent?: string;
  blockResources?: boolean;
  debug?: boolean;
}): Promise<{ browser: Browser; context: BrowserContext; page: Page }> {
  const debug = options?.debug || false;
  
  if (debug) console.log('[PlaywrightBrowser] Creating complete stealth page...');
  
  const browser = await createPlaywrightBrowser({ 
    headless: options?.headless, 
    debug 
  });
  
  const context = await createStealthContext(browser, { 
    userAgent: options?.userAgent, 
    debug 
  });
  
  const page = await createFastPage(context, { 
    blockResources: options?.blockResources, 
    debug 
  });
  
  if (debug) console.log('[PlaywrightBrowser] Complete stealth page created successfully');
  
  return { browser, context, page };
}
