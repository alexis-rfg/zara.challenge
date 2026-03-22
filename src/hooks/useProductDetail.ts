import { useState, useEffect } from 'react';
import { getProductById } from '@/api/products.api';
import type { ProductDetail } from '@/types/product.types';

/**
 * Shape returned by {@link useProductDetail}.
 */
export type UseProductDetailResult = {
  /**
   * The fetched product details, or `null` while loading or when an error
   * has occurred.
   */
  product: ProductDetail | null;
  /** `true` while the fetch is in progress; `false` once settled. */
  loading: boolean;
  /**
   * Human-readable error message when the fetch failed (including when `id`
   * is `undefined`). `null` on success.
   */
  error: string | null;
};

/**
 * Fetches and manages the full detail record for a single product.
 *
 * ### Effect lifecycle & AbortController
 * An `AbortController` is created on every effect run and its signal is
 * threaded down to `fetch()` via `getProductById → apiClient`.
 *
 * | Scenario | What happens |
 * |---|---|
 * | React StrictMode (dev) mounts twice | First effect's controller aborts before its request completes. Second effect issues a fresh request (or hits the 5-minute in-memory cache). |
 * | User navigates away before the response arrives | Controller aborts the in-flight request. No state update occurs on the unmounted component — no "Can't perform a state update on an unmounted component" warning. |
 * | `id` changes (unlikely in this app but correct by default) | Previous effect cleans up (aborts), new effect fetches for the new `id`. |
 *
 * `loading` is only set to `false` when the signal is **not** aborted,
 * preventing a brief flicker on the StrictMode second mount.
 *
 * ### Why `id` is optional
 * React Router's `useParams` can return `undefined` when the param is not
 * present in the matched route. Accepting `undefined` here keeps the hook
 * type-safe at the call site without forcing a non-null assertion.
 *
 * @param id - The product identifier from the URL (e.g. `'APL-IP15P'`), or
 *   `undefined` if the route param is missing.
 * @returns {@link UseProductDetailResult}
 *
 * @example
 * ```tsx
 * const { id } = useParams<{ id: string }>();
 * const { product, loading, error } = useProductDetail(id);
 *
 * if (loading) return <Spinner />;
 * if (error)   return <ErrorMessage message={error} />;
 * if (!product) return null;
 *
 * return <ProductDetailView product={product} />;
 * ```
 */
export function useProductDetail(id: string | undefined): UseProductDetailResult {
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Guard: if the route param is missing there is nothing to fetch.
    // Set an error state immediately so the page can show a meaningful message.
    if (!id) {
      setLoading(false);
      setError('No product ID provided');
      return;
    }

    // A new controller is created on every effect run so that:
    //   - A stale in-flight request (previous `id`) is always cancelled.
    //   - StrictMode's first-mount cleanup aborts cleanly without leaving
    //     a dangling request that could update state on an unmounted component.
    const controller = new AbortController();

    async function fetchProduct(productId: string) {
      setLoading(true);
      setError(null);

      try {
        const data = await getProductById(productId, controller.signal);
        setProduct(data);
      } catch (err) {
        // AbortError is intentional — StrictMode cleanup or the user navigating
        // away before the response arrived. Do not surface as a UI error.
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        // Only clear loading when the request was NOT aborted.
        // This prevents a false "loaded" flash between StrictMode mounts.
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void fetchProduct(id);

    // Cleanup: abort the in-flight request when `id` changes or on unmount.
    return () => controller.abort();
  }, [id]);

  return { product, loading, error };
}
