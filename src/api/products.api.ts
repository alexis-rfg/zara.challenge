import type { ProductDetail, ProductSummary } from '@/types/product.types';
import { apiClient } from './client';
import { parseProductDetailResponse, parseProductsResponse } from './productParsers';

/**
 * Removes duplicate products from an array, keeping only the first occurrence
 * of each `id`.
 *
 * The catalog API occasionally returns the same product multiple times in a
 * single response (observed in `/products` and in the `similarProducts` array
 * of `/products/:id`). Deduplication is applied at the API boundary so that
 * every consumer receives a clean, stable list.
 *
 * @template T - Any object shape that has a string `id` property.
 * @param products - Raw array that may contain duplicate `id` values.
 * @returns New array with at most one entry per `id`, in original order.
 */
const dedupeProductsById = <T extends { id: string }>(products: T[]): T[] => {
  const seenProductIds = new Set<string>();

  return products.filter((product) => {
    if (seenProductIds.has(product.id)) {
      return false;
    }

    seenProductIds.add(product.id);
    return true;
  });
};

/**
 * Fetches a paginated / filtered list of products from `GET /products`.
 *
 * ### Param semantics
 * - **No params** — returns `/products` (all products, server default).
 * - **`limit`** — caps the result set; use `'20'` for the initial home-page load.
 * - **`search`** — server-side full-text filter by name or brand; no `limit`
 *   is applied so all matching results are returned.
 * - **`offset`** — skips the first N results (pagination); not used in the
 *   current UI but exposed for completeness.
 *
 * Duplicate products (same `id`) are removed before the array is returned.
 *
 * @param params - Optional query parameters forwarded to the API.
 * @param signal - Optional `AbortSignal`; when fired the underlying fetch is
 *   cancelled and a `DOMException(AbortError)` propagates to the caller.
 * @returns Deduplicated array of {@link ProductSummary} objects.
 * @throws {ApiError} The server responded with a non-2xx status.
 * @throws {DOMException} The request was cancelled via `signal`.
 *
 * @example
 * ```ts
 * // Initial home-page load — first 20 products
 * const products = await getProducts({ limit: '20' });
 *
 * // Search — all matching results, no limit
 * const results = await getProducts({ search: 'iPhone' });
 * ```
 */
export const getProducts = async (
  params?: { search?: string; limit?: string; offset?: number },
  signal?: AbortSignal,
): Promise<ProductSummary[]> => {
  const queryParams = new URLSearchParams();
  if (params?.search) queryParams.append('search', params.search);
  if (params?.limit) queryParams.append('limit', params.limit);
  if (params?.offset) queryParams.append('offset', params.offset.toString());

  const query = queryParams.toString();
  const endpoint = query ? `/products?${query}` : '/products';
  const rawProducts = await apiClient<unknown>(endpoint, signal);
  const products = parseProductsResponse(rawProducts);

  return dedupeProductsById(products);
};

/**
 * Fetches the full detail record for a single product from `GET /products/:id`.
 *
 * The response already includes the `similarProducts` array — no additional
 * network call is needed to render the "Productos similares" section.
 * Duplicate entries in `similarProducts` are removed before returning.
 *
 * @param id - Unique product identifier (e.g. `'APL-IP15P'`).
 * @param signal - Optional `AbortSignal`; when fired the underlying fetch is
 *   cancelled and a `DOMException(AbortError)` propagates to the caller.
 * @returns Full {@link ProductDetail} including specs, color options, storage
 *   options, and deduplicated similar products.
 * @throws {ApiError} The server responded with a non-2xx status (including 404
 *   when the product ID does not exist).
 * @throws {DOMException} The request was cancelled via `signal`.
 *
 * @example
 * ```ts
 * const detail = await getProductById('APL-IP15P');
 * console.log(detail.name);            // "iPhone 15 Pro"
 * console.log(detail.similarProducts); // deduplicated array
 * ```
 */
export const getProductById = async (id: string, signal?: AbortSignal): Promise<ProductDetail> => {
  const rawProduct = await apiClient<unknown>(`/products/${id}`, signal);
  const product = parseProductDetailResponse(rawProduct);

  return {
    ...product,
    similarProducts: dedupeProductsById(product.similarProducts),
  };
};
