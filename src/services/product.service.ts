import { getProducts, getProductById } from '@/api/products.api';
import type { ProductDetail, ProductSummary } from '@/types/product.types';
import type { FetchProductsParams } from '@/types/service.types';

/**
 * Application-level wrapper around getProducts that enforces the initial-load business rule.
 *
 * @param params - Optional search or limit overrides.
 * @param signal - Optional AbortSignal for request cancellation.
 * @returns Product summaries for the current catalog query.
 */
export const fetchProducts = async (
  params?: FetchProductsParams,
  signal?: AbortSignal,
): Promise<ProductSummary[]> => {
  const defaultParams = params?.search ? { search: params.search } : { limit: '20' };
  return getProducts(defaultParams, signal);
};

/**
 * Fetches the complete product catalog without any result limit.
 *
 * @param signal - Optional AbortSignal for request cancellation.
 * @returns Full catalog product summaries.
 */
export const fetchAllProducts = async (signal?: AbortSignal): Promise<ProductSummary[]> => {
  return getProducts({}, signal);
};

/**
 * Fetches the full detail record for a single product.
 *
 * @param id - Unique product identifier.
 * @param signal - Optional AbortSignal for request cancellation.
 * @returns Full product detail record.
 */
export const fetchProductDetail = async (
  id: string,
  signal?: AbortSignal,
): Promise<ProductDetail> => {
  return getProductById(id, signal);
};
