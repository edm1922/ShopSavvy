/**
 * HTTP client for web scraping with features like user agent rotation,
 * request throttling, automatic retries, and cookie management.
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ScraperError } from './types';

/**
 * List of common user agents to rotate through.
 */
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
];

/**
 * Configuration options for the HTTP client.
 */
export interface HttpClientOptions {
  /**
   * The base URL for all requests.
   */
  baseURL?: string;
  /**
   * The timeout in milliseconds.
   */
  timeout?: number;
  /**
   * The maximum number of retries for failed requests.
   */
  maxRetries?: number;
  /**
   * The delay between retries in milliseconds.
   */
  retryDelay?: number;
  /**
   * Whether to rotate user agents for each request.
   */
  rotateUserAgents?: boolean;
  /**
   * The minimum delay between requests in milliseconds.
   */
  requestDelay?: number;
  /**
   * The platform name (for error reporting).
   */
  platform: string;
}

/**
 * HTTP client for web scraping with features like user agent rotation,
 * request throttling, automatic retries, and cookie management.
 */
export class HttpClient {
  private axiosInstance: AxiosInstance;
  private cookies: Record<string, string> = {};
  private lastRequestTime: number = 0;
  private readonly options: Required<HttpClientOptions>;

  /**
   * Creates a new HTTP client.
   * 
   * @param options The configuration options.
   */
  constructor(options: HttpClientOptions) {
    this.options = {
      baseURL: options.baseURL || '',
      timeout: options.timeout || 10000,
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000,
      rotateUserAgents: options.rotateUserAgents !== false,
      requestDelay: options.requestDelay || 500,
      platform: options.platform,
    };

    this.axiosInstance = axios.create({
      baseURL: this.options.baseURL,
      timeout: this.options.timeout,
    });
  }

  /**
   * Gets a random user agent from the list.
   * 
   * @returns A random user agent string.
   */
  private getRandomUserAgent(): string {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  }

  /**
   * Formats cookies as a string for the Cookie header.
   * 
   * @returns A cookie string.
   */
  private getCookieString(): string {
    return Object.entries(this.cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
  }

  /**
   * Updates cookies from a Set-Cookie header.
   * 
   * @param headers The response headers.
   */
  private updateCookies(headers: Record<string, string | string[]>): void {
    const setCookie = headers['set-cookie'] || [];
    const cookieStrings = Array.isArray(setCookie) ? setCookie : [setCookie];
    
    for (const cookieString of cookieStrings) {
      const [cookiePart] = cookieString.split(';');
      const [key, value] = cookiePart.split('=');
      if (key && value) {
        this.cookies[key.trim()] = value.trim();
      }
    }
  }

  /**
   * Enforces a minimum delay between requests.
   */
  private async enforceRequestDelay(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.options.requestDelay) {
      const delayTime = this.options.requestDelay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delayTime));
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Makes an HTTP request with retries and other features.
   * 
   * @param config The Axios request configuration.
   * @returns A promise that resolves to the response.
   * @throws {ScraperError} If the request fails after all retries.
   */
  async request<T = any>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    await this.enforceRequestDelay();
    
    const headers: Record<string, string> = {
      ...config.headers,
    };
    
    if (this.options.rotateUserAgents) {
      headers['User-Agent'] = this.getRandomUserAgent();
    }
    
    if (Object.keys(this.cookies).length > 0) {
      headers['Cookie'] = this.getCookieString();
    }
    
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.options.maxRetries; attempt++) {
      try {
        const response = await this.axiosInstance.request<T>({
          ...config,
          headers,
        });
        
        this.updateCookies(response.headers);
        return response;
      } catch (error: any) {
        lastError = error;
        
        // Don't retry for certain status codes
        if (error.response && [401, 403, 404].includes(error.response.status)) {
          break;
        }
        
        if (attempt < this.options.maxRetries) {
          const delay = this.options.retryDelay * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw new ScraperError(
      lastError?.message || 'Request failed',
      this.options.platform,
      typeof config.url === 'string' ? config.url : undefined,
      lastError?.response?.status,
      lastError || undefined
    );
  }

  /**
   * Makes a GET request.
   * 
   * @param url The URL to request.
   * @param config Additional Axios request configuration.
   * @returns A promise that resolves to the response.
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.request<T>({
      ...config,
      method: 'GET',
      url,
    });
  }

  /**
   * Makes a POST request.
   * 
   * @param url The URL to request.
   * @param data The data to send.
   * @param config Additional Axios request configuration.
   * @returns A promise that resolves to the response.
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.request<T>({
      ...config,
      method: 'POST',
      url,
      data,
    });
  }
}
