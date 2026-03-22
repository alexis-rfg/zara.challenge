import { getProducts, getProductById } from '@/api/products.api';
import type { ProductDetail, ProductSummary } from '@/types/product.types';

/**
 * Parameters accepted by {@link fetchProducts}.
 *
 * Only one of `search` or `limit` should be active at a time:
 * - `search` triggers a full-text server filter and returns **all** matches
 *   (no limit applied, so the user sees every result).
 * - When `search` is absent the home page shows the **first 20** products via
 *   the default `limit: '20'`.
 */
export type FetchProductsParams = {
  /** Server-side filter term; matches against product name and brand. */
  search?: string;
  /** Maximum number of products to return. Defaults to `'20'` when omitted. */
  limit?: string;
};

/**
 * Application-level wrapper around {@link getProducts} that enforces the
 * home-page loading rule:
 *
 * - **Search active** (`params.search` provided) → `GET /products?search=<term>`
 *   with no limit, returning all matches.
 * - **No search** → `GET /products?limit=20`, returning the first 20 products
 *   for the initial catalog view.
 *
 * This keeps the business rule ("show 20 on load, show all on search") in one
 * place rather than scattered across the UI layer.
 *
 * @param params - Optional search/limit overrides. Omit entirely for the
 *   default initial-load behaviour.
 * @param signal - Optional `AbortSignal` forwarded to the underlying fetch so
 *   callers can cancel in-flight requests on component cleanup.
 * @returns Array of {@link ProductSummary} objects (deduplicated by ID).
 * @throws {ApiError} The server responded with a non-2xx status.
 * @throws {DOMException} The request was cancelled via `signal`.
 *
 * @example
 * ```ts
 * // Initial load — first 20
 * const products = await fetchProducts();
 *
 * // Search — all matches
 * const results = await fetchProducts({ search: 'Samsung' });
 *
 * // Cancellable inside a useEffect
 * const controller = new AbortController();
 * const data = await fetchProducts(undefined, controller.signal);
 * // cleanup: controller.abort();
 * ```
 */
export const fetchProducts = async (
  params?: FetchProductsParams,
  signal?: AbortSignal,
): Promise<ProductSummary[]> => {
  const defaultParams = params?.search ? { search: params.search } : { limit: '20' };
  return getProducts(defaultParams, signal);
};

/**
 * Fetches the **complete** product catalog without any limit.
 *
 * Used by features that need the full set of products (e.g. the color-filter
 * panel which must inspect color options across all catalog entries). Keeping
 * this in the service layer means hooks never import from the API boundary
 * directly, preserving the Presentation → Application → Infrastructure flow.
 *
 * @param signal - Optional `AbortSignal` forwarded to the underlying fetch.
 * @returns All {@link ProductSummary} objects in the catalog (deduplicated).
 */
export const fetchAllProducts = async (signal?: AbortSignal): Promise<ProductSummary[]> => {
  return getProducts({}, signal);
};

/**
 * Fetches the full detail record for a single product.
 *
 * A service-layer thin wrapper around {@link getProductById} that keeps hooks
 * decoupled from the API boundary. Any cross-cutting concern added to the
 * service layer (caching policy, telemetry, feature flags) is automatically
 * inherited by all callers.
 *
 * @param id - Unique product identifier (e.g. `'APL-IP15P'`).
 * @param signal - Optional `AbortSignal`; cancels the underlying fetch when fired.
 * @returns Full {@link ProductDetail} including specs, color options, storage
 *   options, and deduplicated similar products.
 */
export const fetchProductDetail = async (
  id: string,
  signal?: AbortSignal,
): Promise<ProductDetail> => {
  return getProductById(id, signal);
};
