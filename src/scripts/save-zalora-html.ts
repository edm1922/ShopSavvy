/**
 * Script to save Zalora HTML for testing
 * 
 * This script fetches HTML from Zalora and saves it to a file for testing.
 */

import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';
import { chromium } from 'playwright-core';

// Path to save the HTML file
const HTML_FILE_PATH = path.join(process.cwd(), 'zalora-test.html');

/**
 * Main function
 */
async function main() {
  console.log('Starting Zalora HTML fetcher...');
  
  try {
    // Try with Playwright first
    console.log('Trying with Playwright...');
    await fetchWithPlaywright();
  } catch (playwrightError) {
    console.error('Error with Playwright:', playwrightError);
    
    try {
      // Fall back to Puppeteer
      console.log('Falling back to Puppeteer...');
      await fetchWithPuppeteer();
    } catch (puppeteerError) {
      console.error('Error with Puppeteer:', puppeteerError);
      console.error('Failed to fetch HTML with both methods.');
    }
  }
}

/**
 * Fetch HTML with Playwright
 */
async function fetchWithPlaywright() {
  const browser = await chromium.launch({
    headless: false,
    args: [
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-site-isolation-trials',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });
  
  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 }
    });
    
    const page = await context.newPage();
    
    // Navigate to Zalora
    console.log('Navigating to Zalora...');
    await page.goto('https://www.zalora.com.ph/search?q=socks', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    
    // Wait for content to load
    console.log('Waiting for content to load...');
    await page.waitForTimeout(5000);
    
    // Scroll to load more content
    console.log('Scrolling to load more content...');
    await autoScroll(page);
    
    // Get HTML content
    console.log('Getting HTML content...');
    const html = await page.content();
    
    // Save HTML to file
    console.log(`Saving HTML to ${HTML_FILE_PATH}...`);
    fs.writeFileSync(HTML_FILE_PATH, html);
    
    console.log(`HTML saved to ${HTML_FILE_PATH} (${html.length} bytes)`);
  } finally {
    await browser.close();
  }
}

/**
 * Fetch HTML with Puppeteer
 */
async function fetchWithPuppeteer() {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: [
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--disable-site-isolation-trials',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });
  
  try {
    const page = await browser.newPage();
    
    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');
    
    // Navigate to Zalora
    console.log('Navigating to Zalora...');
    await page.goto('https://www.zalora.com.ph/search?q=socks', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });
    
    // Wait for content to load
    console.log('Waiting for content to load...');
    await page.waitForTimeout(5000);
    
    // Scroll to load more content
    console.log('Scrolling to load more content...');
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          
          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
    
    // Get HTML content
    console.log('Getting HTML content...');
    const html = await page.content();
    
    // Save HTML to file
    console.log(`Saving HTML to ${HTML_FILE_PATH}...`);
    fs.writeFileSync(HTML_FILE_PATH, html);
    
    console.log(`HTML saved to ${HTML_FILE_PATH} (${html.length} bytes)`);
  } finally {
    await browser.close();
  }
}

/**
 * Auto-scroll function for Playwright
 */
async function autoScroll(page: any) {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

// Run the main function
main();
