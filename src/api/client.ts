import { env } from '@/env';

const API_BASE_URL = env().baseUrl;
const API_KEY = env().apiKey;

/**
 * Custom error class for API-related errors.
 * Extends the native Error class with HTTP status information.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Generic API client for making authenticated requests to the backend.
 * Automatically includes the API key in request headers.
 *
 * @template T - The expected response type
 * @param endpoint - The API endpoint path (e.g., '/products' or '/products/123')
 * @returns Promise resolving to the typed response data
 * @throws {ApiError} When the API returns a non-OK status code
 * @throws {Error} When a network error occurs
 *
 * @example
 * ```typescript
 * // Fetch products
 * const products = await apiClient<ProductSummary[]>('/products?limit=20');
 *
 * // Fetch single product
 * const product = await apiClient<ProductDetail>('/products/iphone-15');
 * ```
 */
export const apiClient = async <T>(endpoint: string): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      headers: {
        'x-api-key': API_KEY,
      },
    });
    if (!response.ok) {
      throw new ApiError(
        `API request failded: ${response.status} ${response.statusText}`,
        response.status,
        response.statusText,
      );
    }
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};
