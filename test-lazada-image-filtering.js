/**
 * Test script to verify the Lazada image filtering functionality
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

async function testLazadaImageFiltering() {
  console.log('Starting Lazada image filtering test...');
  
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
    console.error('Error during test:', error);
  } finally {
    // Keep the browser open for manual inspection
    console.log('Test complete. Browser will remain open for inspection.');
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
  
  // Test image filtering
  await testImageFiltering(page);
}

async function testImageFiltering(page) {
  console.log('Testing image filtering...');
  
  // Extract all images
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
  
  // Save all images to a file
  fs.writeFileSync('lazada-all-images.json', JSON.stringify(filteredImages, null, 2));
  console.log('All images saved to lazada-all-images.json');
  
  // Identify promotional images
  const promotionalPatterns = [
    'lazmall', 
    'LazMall',
    'badge',
    'Badge',
    'tps/images/ims-web',
    'tps/imgextra',
    'TB1whF0i9slXu8jSZFuXXXg7FXa',
    'O1CN01GeOVhh1c0uglyGAIk',
    'tps/tfs/TB1',
    'tps/TB1'
  ];
  
  // Identify promotional images
  const promotionalImages = filteredImages.filter(img => {
    for (const pattern of promotionalPatterns) {
      if (img.src.includes(pattern)) {
        return true;
      }
    }
    return false;
  });
  
  // Identify non-promotional images
  const nonPromotionalImages = filteredImages.filter(img => {
    for (const pattern of promotionalPatterns) {
      if (img.src.includes(pattern)) {
        return false;
      }
    }
    return true;
  });
  
  // Save promotional images to a file
  fs.writeFileSync('lazada-promotional-images.json', JSON.stringify(promotionalImages, null, 2));
  console.log(`Found ${promotionalImages.length} promotional images, saved to lazada-promotional-images.json`);
  
  // Save non-promotional images to a file
  fs.writeFileSync('lazada-non-promotional-images.json', JSON.stringify(nonPromotionalImages, null, 2));
  console.log(`Found ${nonPromotionalImages.length} non-promotional images, saved to lazada-non-promotional-images.json`);
  
  // Generate HTML report
  const htmlReport = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Lazada Image Filtering Test</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 20px; }
      h1, h2 { color: #333; }
      .image-container { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 20px; }
      .image-item { border: 1px solid #ddd; padding: 10px; width: 200px; }
      .image-item img { max-width: 100%; height: auto; }
      .image-info { font-size: 12px; margin-top: 5px; }
    </style>
  </head>
  <body>
    <h1>Lazada Image Filtering Test</h1>
    
    <h2>Promotional Images (${promotionalImages.length})</h2>
    <div class="image-container">
      ${promotionalImages.map(img => `
        <div class="image-item">
          <img src="${img.src}" alt="${img.alt}" />
          <div class="image-info">
            <p>Size: ${img.width}x${img.height}</p>
            <p>Class: ${img.className}</p>
            <p>Parent: ${img.parentSelector}</p>
          </div>
        </div>
      `).join('')}
    </div>
    
    <h2>Non-Promotional Images (${nonPromotionalImages.length})</h2>
    <div class="image-container">
      ${nonPromotionalImages.map(img => `
        <div class="image-item">
          <img src="${img.src}" alt="${img.alt}" />
          <div class="image-info">
            <p>Size: ${img.width}x${img.height}</p>
            <p>Class: ${img.className}</p>
            <p>Parent: ${img.parentSelector}</p>
          </div>
        </div>
      `).join('')}
    </div>
  </body>
  </html>
  `;
  
  fs.writeFileSync('lazada-image-filtering-report.html', htmlReport);
  console.log('HTML report saved to lazada-image-filtering-report.html');
}

// Run the test
testLazadaImageFiltering();
