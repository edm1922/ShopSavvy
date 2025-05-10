/**
 * Test script to analyze Lazada product page HTML structure
 * and identify the correct selectors for product images
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

async function analyzeLazadaImages() {
  console.log('Starting Lazada image analysis...');

  const browser = await puppeteer.launch({
    headless: false, // Set to true for production
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Set viewport to a reasonable size
    await page.setViewport({ width: 1280, height: 800 });

    // Set user agent to avoid detection
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');

    // Navigate to a Lazada search page for hats
    console.log('Navigating to Lazada search page...');
    await page.goto('https://www.lazada.com.ph/catalog/?q=hats', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    // Wait for product cards to load
    await page.waitForSelector('[data-tracking="product-card"]', { timeout: 10000 })
      .catch(() => console.log('Product card selector not found, continuing anyway'));

    // Get the first product URL
    const productUrl = await page.evaluate(() => {
      const productCards = document.querySelectorAll('[data-tracking="product-card"]');
      if (productCards.length > 0) {
        const link = productCards[0].querySelector('a');
        return link ? link.href : null;
      }
      return null;
    });

    if (!productUrl) {
      console.log('No product URL found. Trying alternative selector...');
      // Try alternative selector
      const altProductUrl = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href*="/products/"]'));
        return links.length > 0 ? links[0].href : null;
      });

      if (!altProductUrl) {
        throw new Error('Could not find any product URLs');
      }

      console.log(`Found product URL using alternative selector: ${altProductUrl}`);
      await navigateToProductPage(page, altProductUrl);
    } else {
      console.log(`Found product URL: ${productUrl}`);
      await navigateToProductPage(page, productUrl);
    }

  } catch (error) {
    console.error('Error during analysis:', error);
  } finally {
    // Keep the browser open for manual inspection
    console.log('Analysis complete. Browser will remain open for inspection.');
    console.log('Press Ctrl+C to close the browser and exit.');
  }
}

async function navigateToProductPage(page, url) {
  console.log(`Navigating to product page: ${url}`);
  await page.goto(url, {
    waitUntil: 'networkidle2',
    timeout: 60000
  });

  // Wait for the page to fully load
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Take a screenshot for reference
  await page.screenshot({ path: 'lazada-product-page.png' });
  console.log('Screenshot saved as lazada-product-page.png');

  // Analyze the page structure
  await analyzePageStructure(page);
}

async function analyzePageStructure(page) {
  console.log('Analyzing page structure...');

  // Check for promotional elements
  const promotionalElements = await page.evaluate(() => {
    const results = [];

    // Check for LazMall logo
    const lazMallElements = document.querySelectorAll('img[src*="lazmall"], img[alt*="LazMall"], .pdp-block img[src*="lazmall"]');
    if (lazMallElements.length > 0) {
      results.push({
        type: 'LazMall Logo',
        count: lazMallElements.length,
        selectors: '.pdp-block img[src*="lazmall"]',
        examples: Array.from(lazMallElements).slice(0, 3).map(el => el.src || 'No src')
      });
    }

    // Check for other promotional badges
    const badgeElements = document.querySelectorAll('.pdp-mod-product-badge, .pdp-block img[src*="badge"], img[alt*="badge"]');
    if (badgeElements.length > 0) {
      results.push({
        type: 'Promotional Badge',
        count: badgeElements.length,
        selectors: '.pdp-mod-product-badge, .pdp-block img[src*="badge"]',
        examples: Array.from(badgeElements).slice(0, 3).map(el => el.src || el.innerText || 'No src/text')
      });
    }

    return results;
  });

  console.log('Promotional elements found:');
  console.log(JSON.stringify(promotionalElements, null, 2));

  // Analyze color family section
  const colorFamilyAnalysis = await page.evaluate(() => {
    // Look for color family section
    const colorFamilySection = document.querySelector('.sku-prop-content, .sku-prop-selection, [data-spm="color_family"]');

    if (!colorFamilySection) {
      return {
        found: false,
        message: 'Color family section not found'
      };
    }

    // Analyze the images in the color family section
    const images = colorFamilySection.querySelectorAll('img');

    return {
      found: true,
      sectionSelector: colorFamilySection.className,
      imageCount: images.length,
      imageSelectors: '.sku-prop-content img, .sku-variable-img-wrap img',
      imageExamples: Array.from(images).slice(0, 5).map(img => ({
        src: img.src,
        alt: img.alt,
        className: img.className,
        parentClass: img.parentElement ? img.parentElement.className : 'No parent'
      }))
    };
  });

  console.log('Color family analysis:');
  console.log(JSON.stringify(colorFamilyAnalysis, null, 2));

  // Analyze main product images
  const mainImageAnalysis = await page.evaluate(() => {
    // Look for main product image container
    const mainImageContainer = document.querySelector('.pdp-block-main, .gallery-preview-panel, .next-slick-track');

    if (!mainImageContainer) {
      return {
        found: false,
        message: 'Main image container not found'
      };
    }

    // Analyze the main product images
    const images = mainImageContainer.querySelectorAll('img');

    return {
      found: true,
      containerSelector: mainImageContainer.className,
      imageCount: images.length,
      imageSelectors: '.pdp-block-main img, .gallery-preview-panel img',
      imageExamples: Array.from(images).slice(0, 5).map(img => ({
        src: img.src,
        alt: img.alt,
        className: img.className,
        parentClass: img.parentElement ? img.parentElement.className : 'No parent'
      }))
    };
  });

  console.log('Main image analysis:');
  console.log(JSON.stringify(mainImageAnalysis, null, 2));

  // Save the analysis to a file
  const analysisData = {
    url: await page.url(),
    title: await page.title(),
    promotionalElements,
    colorFamilyAnalysis,
    mainImageAnalysis
  };

  fs.writeFileSync('lazada-image-analysis.json', JSON.stringify(analysisData, null, 2));
  console.log('Analysis saved to lazada-image-analysis.json');

  // Extract all image URLs for inspection
  const allImages = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('img')).map(img => ({
      src: img.src,
      alt: img.alt || '',
      width: img.width,
      height: img.height,
      className: img.className,
      id: img.id,
      parentSelector: img.parentElement ?
        (img.parentElement.className ? '.' + img.parentElement.className.replace(/\s+/g, '.') :
         (img.parentElement.id ? '#' + img.parentElement.id : 'Unknown')) :
        'No parent'
    }));
  });

  // Filter out tiny images (likely icons) and sort by size
  const filteredImages = allImages
    .filter(img => img.width > 50 && img.height > 50)
    .sort((a, b) => (b.width * b.height) - (a.width * a.height));

  fs.writeFileSync('lazada-all-images.json', JSON.stringify(filteredImages, null, 2));
  console.log('All images saved to lazada-all-images.json');
}

// Run the analysis
analyzeLazadaImages();
