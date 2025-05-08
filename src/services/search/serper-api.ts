/**
 * Serper.dev API service for product search.
 *
 * This service uses Serper.dev to search for products across multiple marketplaces.
 */

import axios from 'axios';
import { Product } from '../scrapers/types';
import { SearchFilters } from '../shopping-apis';

// Serper.dev API key
const SERPER_API_KEY = '3986a10df3a191c663afa1d08d3929d1a47fb875';

// Serper.dev API endpoint
const SERPER_API_ENDPOINT = 'https://google.serper.dev/shopping';

/**
 * Interface for Serper.dev shopping search response.
 */
interface SerperShoppingResponse {
  searchParameters: {
    q: string;
    gl: string;
    hl: string;
  };
  shopping: SerperShoppingItem[];
  pagination: {
    currentPage: number;
    nextPage: number;
  };
}

/**
 * Interface for Serper.dev shopping item.
 */
interface SerperShoppingItem {
  title: string;
  price: string;
  extractedPrice?: number;
  link: string;
  source: string;
  rating?: {
    rating: number;
    count: number;
  };
  imageUrl: string;
  shippingInfo?: string;
  sponsored?: boolean;
}

/**
 * Searches for products using Serper.dev API.
 *
 * @param query The search query.
 * @param filters Optional search filters.
 * @param page The page number (1-based).
 * @param country The country code (default: 'ph' for Philippines).
 * @param language The language code (default: 'en' for English).
 * @returns A promise that resolves to an array of Product objects.
 */
export async function searchProducts(
  query: string,
  filters?: SearchFilters,
  page: number = 1,
  country: string = 'ph',
  language: string = 'en'
): Promise<Product[]> {
  try {
    console.log(`[SerperAPI] Searching for: "${query}"`, filters);

    // Build the search query
    let searchQuery = query;

    // Add filters to the query if provided
    if (filters) {
      if (filters.minPrice && filters.maxPrice) {
        searchQuery += ` price:${filters.minPrice}-${filters.maxPrice}`;
      } else if (filters.minPrice) {
        searchQuery += ` price:${filters.minPrice}-`;
      } else if (filters.maxPrice) {
        searchQuery += ` price:-${filters.maxPrice}`;
      }

      if (filters.brand) {
        searchQuery += ` ${filters.brand}`;
      }
    }

    console.log(`[SerperAPI] Final search query: "${searchQuery}"`);
    console.log(`[SerperAPI] Making API request to ${SERPER_API_ENDPOINT}`);

    // Make the API request
    const response = await axios.post<SerperShoppingResponse>(
      SERPER_API_ENDPOINT,
      {
        q: searchQuery,
        gl: country,
        hl: language,
        page: page,
      },
      {
        headers: {
          'X-API-KEY': SERPER_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    console.log(`[SerperAPI] Got response with status: ${response.status}`);

    // Check if the response is valid
    if (!response.data) {
      console.error('[SerperAPI] No data in response');
      return [];
    }

    if (!response.data.shopping) {
      console.error('[SerperAPI] No shopping data in response:', response.data);
      return [];
    }

    if (!Array.isArray(response.data.shopping)) {
      console.error('[SerperAPI] Shopping data is not an array:', response.data.shopping);
      return [];
    }

    console.log(`[SerperAPI] Raw response contains ${response.data.shopping.length} items`);

    // Map the response to our Product model
    const products = response.data.shopping.map((item) => mapSerperItemToProduct(item));

    console.log(`[SerperAPI] Mapped ${products.length} products`);

    // Log the first few products for debugging
    if (products.length > 0) {
      console.log('[SerperAPI] First product:', JSON.stringify(products[0], null, 2));
    }

    return products;
  } catch (error) {
    console.error('[SerperAPI] Error searching products:', error);

    if (axios.isAxiosError(error)) {
      console.error('[SerperAPI] Axios error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      });
    }

    return [];
  }
}

/**
 * Maps a Serper.dev shopping item to our Product model.
 *
 * @param item The Serper.dev shopping item.
 * @returns A Product object.
 */
function mapSerperItemToProduct(item: SerperShoppingItem): Product {
  // Extract the price from the price string
  const extractedPrice = extractPrice(item.price);

  // Determine the platform from the source or link
  const platform = determinePlatform(item.source, item.link);

  // Generate a unique ID using a combination of platform, title, and price
  // Add a random component to ensure uniqueness
  const randomStr = Math.random().toString(36).substring(2, 8);
  const titleHash = Buffer.from(item.title).toString('base64').substring(0, 10);
  const id = `serper_${platform.toLowerCase()}_${titleHash}_${extractedPrice}_${randomStr}`;

  return {
    id,
    title: item.title,
    price: item.extractedPrice || extractedPrice,
    productUrl: item.link,
    platform,
    imageUrl: item.imageUrl,
    rating: item.rating?.rating,
    ratingCount: item.rating?.count,
    shippingInfo: item.shippingInfo,
  };
}

/**
 * Extracts a price from a price string.
 *
 * @param priceString The price string to extract from.
 * @returns The extracted price as a number, or 0 if extraction fails.
 */
function extractPrice(priceString: string): number {
  try {
    // Remove currency symbols and non-numeric characters except for decimal points
    const cleanedPrice = priceString.replace(/[^\d.]/g, '');
    return parseFloat(cleanedPrice) || 0;
  } catch (error) {
    console.error('[SerperAPI] Error extracting price:', error);
    return 0;
  }
}

/**
 * Determines the platform from the source or link.
 *
 * @param source The source of the product.
 * @param link The link to the product.
 * @returns The platform name.
 */
function determinePlatform(source: string, link: string): string {
  // Convert to lowercase for case-insensitive matching
  const sourceLower = source.toLowerCase();
  const linkLower = link.toLowerCase();

  // Define platform patterns to check
  const platformPatterns = [
    // Philippine e-commerce platforms
    { pattern: 'shopee', name: 'Shopee' },
    { pattern: 'lazada', name: 'Lazada' },
    { pattern: 'zalora', name: 'Zalora' },
    { pattern: 'beautymnl', name: 'BeautyMNL' },
    { pattern: 'galleon', name: 'Galleon' },
    { pattern: 'shein', name: 'SHEIN' },
    { pattern: 'carousell', name: 'Carousell' },
    { pattern: 'edamama', name: 'Edamama' },
    { pattern: 'kimstore', name: 'Kimstore' },
    { pattern: 'abenson', name: 'Abenson' },
    { pattern: 'metromart', name: 'MetroMart' },
    { pattern: 'watsons', name: 'Watsons' },
    { pattern: 'smstore', name: 'SM Store' },
    { pattern: 'robinsons', name: 'Robinsons' },
    { pattern: 'landers', name: 'Landers' },
    { pattern: 's&r', name: 'S&R' },
    { pattern: 'puregold', name: 'Puregold' },
    { pattern: 'datablitz', name: 'DataBlitz' },
    { pattern: 'gameline', name: 'GameLine' },
    { pattern: 'gameoneph', name: 'GameOne' },
    { pattern: 'toy kingdom', name: 'Toy Kingdom' },
    { pattern: 'toysrus', name: 'Toys R Us' },
    { pattern: 'nationalbookstore', name: 'National Book Store' },
    { pattern: 'fully booked', name: 'Fully Booked' },
    { pattern: 'mercury drug', name: 'Mercury Drug' },
    { pattern: 'southstar drug', name: 'Southstar Drug' },
    { pattern: 'rose pharmacy', name: 'Rose Pharmacy' },
    { pattern: 'generika', name: 'Generika' },
    { pattern: 'cdrskincare', name: 'CDR Skincare' },

    // International e-commerce platforms
    { pattern: 'amazon', name: 'Amazon' },
    { pattern: 'ebay', name: 'eBay' },
    { pattern: 'walmart', name: 'Walmart' },
    { pattern: 'bestbuy', name: 'Best Buy' },
    { pattern: 'target', name: 'Target' },
    { pattern: 'newegg', name: 'Newegg' },
    { pattern: 'aliexpress', name: 'AliExpress' },
    { pattern: 'etsy', name: 'Etsy' },
    { pattern: 'wish', name: 'Wish' },
    { pattern: 'temu', name: 'Temu' },
    { pattern: 'jd.com', name: 'JD.com' },
    { pattern: 'taobao', name: 'Taobao' },
    { pattern: 'tmall', name: 'Tmall' },
    { pattern: 'rakuten', name: 'Rakuten' },
    { pattern: 'flipkart', name: 'Flipkart' },
    { pattern: 'noon', name: 'Noon' },
    { pattern: 'jumia', name: 'Jumia' },
    { pattern: 'mercadolibre', name: 'MercadoLibre' },
    { pattern: 'coupang', name: 'Coupang' },
    { pattern: 'tokopedia', name: 'Tokopedia' },
    { pattern: 'bukalapak', name: 'Bukalapak' },
    { pattern: 'blibli', name: 'Blibli' },
    { pattern: 'qoo10', name: 'Qoo10' },
    { pattern: 'gmarket', name: 'Gmarket' },
    { pattern: '11street', name: '11Street' },
    { pattern: 'shopclues', name: 'ShopClues' },
    { pattern: 'snapdeal', name: 'Snapdeal' },
    { pattern: 'myntra', name: 'Myntra' },
    { pattern: 'nykaa', name: 'Nykaa' },
    { pattern: 'paytm mall', name: 'Paytm Mall' },
    { pattern: 'jiomart', name: 'JioMart' },
    { pattern: 'bigbasket', name: 'BigBasket' },
    { pattern: 'grofers', name: 'Grofers' },
    { pattern: 'lelong', name: 'Lelong' },
    { pattern: 'shopback', name: 'ShopBack' },
    { pattern: 'shopee', name: 'Shopee' }, // Repeated for different regions
    { pattern: 'lazada', name: 'Lazada' }, // Repeated for different regions
  ];

  // Check source and link against platform patterns
  for (const { pattern, name } of platformPatterns) {
    if (sourceLower.includes(pattern) || linkLower.includes(pattern)) {
      return name;
    }
  }

  // If no known platform is found, return the source
  return source;
}
