import type { ProductDetail, ProductSummary } from '@/types/product.types';
import { apiClient } from './client';

/**
 * Fetches a list of products from the API with optional filtering and pagination.
 *
 * @param params - Optional query parameters
 * @param params.search - Search term to filter products by name or brand
 * @param params.limit - Maximum number of products to return
 * @param params.offset - Number of products to skip for pagination
 * @returns Promise resolving to an array of product summaries
 * @throws {ApiError} When the API request fails
 *
 * @example
 * ```typescript
 * // Get first 20 products
 * const products = await getProducts({ limit: '20' });
 *
 * // Search for products
 * const results = await getProducts({ search: 'iPhone' });
 * ```
 */
export const getProducts = async (params?: {
  search?: string;
  limit?: string;
  offset?: number;
}): Promise<ProductSummary[]> => {
  const queryParms = new URLSearchParams();
  if (params?.search) {
    queryParms.append('search', params.search);
  }
  if (params?.limit) {
    queryParms.append('limit', params.limit);
  }
  if (params?.offset) {
    queryParms.append('offset', params.offset.toString());
  }
  const query = queryParms.toString();
  const endpoint = query ? `/products?${query}` : '/products';
  return apiClient<ProductSummary[]>(endpoint);
};

/**
 * Fetches detailed information for a specific product by its ID.
 *
 * @param id - The unique identifier of the product
 * @returns Promise resolving to the complete product details including specs, colors, storage options, and similar products
 * @throws {ApiError} When the API request fails or product is not found
 *
 * @example
 * ```typescript
 * const product = await getProductById('iphone-15-pro');
 * console.log(product.name, product.basePrice);
 * ```
 */
export const getProductById = async (id: string): Promise<ProductDetail> => {
  return apiClient<ProductDetail>(`/products/${id}`);
};
