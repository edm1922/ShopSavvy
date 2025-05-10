import { NextResponse } from 'next/server';

/**
 * Image proxy to bypass CORS restrictions from e-commerce platforms
 *
 * @param {Request} request - The incoming request
 * @returns {Promise<Response>} - The proxied image response
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    console.error('Image proxy called without URL parameter');
    return NextResponse.json(
      { error: 'Missing image URL parameter' },
      { status: 400 }
    );
  }

  console.log(`Image proxy request for: ${imageUrl.substring(0, 100)}...`);

  try {
    // Decode the URL if it's encoded
    const decodedUrl = decodeURIComponent(imageUrl);

    // Fix common URL issues
    let processedUrl = decodedUrl;

    // Ensure HTTPS
    processedUrl = processedUrl.replace(/^http:/, 'https:');

    // Handle Lazada CDN domains with special parameters
    if (processedUrl.includes('lzd-img-global.slatic.net') ||
        processedUrl.includes('ph-live.slatic.net') ||
        processedUrl.includes('my-live-02.slatic.net') ||
        processedUrl.includes('sg-live.slatic.net') ||
        processedUrl.includes('img.lazcdn.com')) {

      // Check if this is a placeholder/icon image (tps-60-60, tps-40-40, etc.)
      if (processedUrl.includes('/tps/imgextra/') &&
          (processedUrl.includes('-tps-60-60.') ||
           processedUrl.includes('-tps-40-40.') ||
           processedUrl.includes('-tps-20-20.'))) {
        console.log('Detected placeholder icon image, attempting to transform URL...');

        // Extract the item ID if present in the URL
        const itemIdMatch = processedUrl.match(/item-([a-zA-Z0-9]+)/) ||
                           processedUrl.match(/i([a-zA-Z0-9]+)-/) ||
                           processedUrl.match(/O1CN01[a-zA-Z0-9]+/);

        if (itemIdMatch && itemIdMatch[1]) {
          const itemId = itemIdMatch[1];
          // Try to construct a better URL using the item ID
          processedUrl = `https://ph-live.slatic.net/p/item-${itemId}.jpg`;
          console.log(`Transformed to: ${processedUrl}`);
        } else {
          // If we can't extract an item ID, try a different approach
          // Convert from the global CDN to the local CDN which often has better images
          if (processedUrl.includes('lzd-img-global.slatic.net')) {
            processedUrl = processedUrl.replace('lzd-img-global.slatic.net', 'ph-live.slatic.net');
            console.log(`Switched to local CDN: ${processedUrl}`);
          }
        }
      }

      // For URLs with "cleaned" parameter in them, try to get the original URL
      if (processedUrl.includes('Cleaned URL:')) {
        const cleanedMatch = processedUrl.match(/Cleaned URL:\s*(https?:\/\/[^\s]+)/);
        if (cleanedMatch && cleanedMatch[1]) {
          processedUrl = cleanedMatch[1];
          console.log(`Using cleaned URL: ${processedUrl}`);
        }
      }

      // Remove size constraints from URLs (like _80x80q80, _120x120q80, etc.)
      processedUrl = processedUrl.replace(/_([\d]+x[\d]+q[\d]+)(\.jpg|\.png|\.webp|\.jpg_.webp)/, '$2');

      // Also handle other size formats
      processedUrl = processedUrl.replace(/_([\d]+x[\d]+)(\.jpg|\.png|\.webp|\.jpg_.webp)/, '$2');

      // Handle .jpg_.webp extension (common in img.lazcdn.com URLs)
      if (processedUrl.endsWith('.jpg_.webp')) {
        processedUrl = processedUrl.replace('.jpg_.webp', '.jpg');
        console.log(`Converted .jpg_.webp to .jpg: ${processedUrl}`);
      }
    }

    console.log(`Processed URL: ${processedUrl.substring(0, 100)}...`);

    // Set up headers to mimic a browser request
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
      'Referer': 'https://www.lazada.com.ph/',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Sec-Fetch-Dest': 'image',
      'Sec-Fetch-Mode': 'no-cors',
      'Sec-Fetch-Site': 'cross-site',
      'Pragma': 'no-cache',
    };

    // Fetch the image with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(processedUrl, {
      headers,
      signal: controller.signal,
      redirect: 'follow',
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.status} ${response.statusText} for URL: ${processedUrl.substring(0, 100)}...`);

      // Try a fallback approach for Lazada images
      if (processedUrl.includes('lzd-img-global.slatic.net') || processedUrl.includes('ph-live.slatic.net')) {
        console.log('Attempting fallback for Lazada image...');

        // Try with a different referer
        const fallbackHeaders = {
          ...headers,
          'Referer': 'https://www.google.com/',
        };

        const fallbackResponse = await fetch(processedUrl, {
          headers: fallbackHeaders,
          redirect: 'follow',
        });

        if (fallbackResponse.ok) {
          console.log('Fallback successful!');
          const imageData = await fallbackResponse.arrayBuffer();
          const contentType = fallbackResponse.headers.get('content-type') || 'image/jpeg';

          return new NextResponse(imageData, {
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=86400',
              'Access-Control-Allow-Origin': '*',
            },
          });
        } else {
          console.error(`Fallback also failed: ${fallbackResponse.status} ${fallbackResponse.statusText}`);
        }
      }

      // If we get here, both attempts failed
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.status}` },
        { status: response.status }
      );
    }

    // Get the image data
    const imageData = await response.arrayBuffer();

    // Get the content type from the response
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    console.log(`Successfully proxied image (${contentType}, ${imageData.byteLength} bytes)`);

    // Return the image with appropriate headers
    return new NextResponse(imageData, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error proxying image:', error);

    // Return a placeholder image instead of an error
    try {
      // Fetch a placeholder image from the local server
      const placeholderUrl = new URL('/images/product-placeholder.svg', request.url).toString();
      const placeholderResponse = await fetch(placeholderUrl);
      const placeholderData = await placeholderResponse.arrayBuffer();

      return new NextResponse(placeholderData, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=86400',
          'Access-Control-Allow-Origin': '*',
          'X-Image-Error': 'Original image failed to load',
        },
      });
    } catch (placeholderError) {
      console.error('Error fetching placeholder image:', placeholderError);
      return NextResponse.json(
        { error: 'Failed to proxy image and failed to load placeholder' },
        { status: 500 }
      );
    }
  }
}
