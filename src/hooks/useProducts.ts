import { useState, useEffect, useCallback } from 'react';
import { fetchProducts } from '@/services/product.service';
import { ErrorFactory, getErrorMessage, logError } from '@/utils/error.utils';
import { createLogger } from '@/utils/logger';
import type { ProductSummary } from '@/types/product.types';

const productsLogger = createLogger({
  scope: 'products.list',
  tags: ['products', 'search'],
});

/**
 * Shape returned by {@link useProducts}.
 */
export type UseProductsResult = {
  /** Current list of products matching the last committed search (or the initial 20). */
  products: ProductSummary[];
  /** `true` while a fetch is in progress; `false` once settled. */
  loading: boolean;
  /**
   * Human-readable error message when the last fetch failed.
   * `null` when no error has occurred or after a successful retry.
   */
  error: string | null;
  /**
   * The search term that was **last submitted to the API** — i.e. what the
   * user confirmed by pressing Enter or by clicking the clear button.
   *
   * This is intentionally separate from the raw input value that lives inside
   * `SearchBar`. The list, result count, and empty-state message all reflect
   * `committedSearch`, not what the user is currently typing.
   */
  committedSearch: string;
  /**
   * Submits a search term to the API.
   *
   * Trims whitespace before storing. Passing an empty string resets the view
   * to the default initial load (first 20 products).
   *
   * This is the only way to trigger a new fetch — typing alone does nothing.
   */
  submitSearch: (term: string) => void;
  /** Total number of products in the current result set. */
  resultCount: number;
};

/**
 * Manages the product list for the home page, including initial load and
 * on-demand search.
 *
 * ### Search model
 * The hook separates two concerns that are often conflated:
 *
 * | Concern | Owner |
 * |---|---|
 * | What the user is **typing** | `SearchBar` (local state, no re-renders upstream) |
 * | What was **submitted** to the API | `committedSearch` in this hook |
 *
 * A fetch only fires when `committedSearch` changes — i.e. when the user
 * presses **Enter** or clicks the **X** clear button. Keystrokes alone never
 * trigger a network request.
 *
 * ### Effect lifecycle & AbortController
 * Each time `committedSearch` changes a new `AbortController` is created.
 * Its signal is passed all the way down to `fetch()` inside `apiClient`.
 *
 * | Scenario | What happens |
 * |---|---|
 * | React StrictMode (dev) mounts component twice | First effect's controller aborts before its request completes. Second effect issues a fresh request (or hits the in-memory cache if the first completed). |
 * | User submits a new search before the previous one resolves | Previous effect's controller aborts its request. New effect starts a fresh fetch. |
 * | Component unmounts (user navigates away) | Controller aborts the in-flight request. No state update occurs on an unmounted component. |
 *
 * `loading` is only set to `false` when the signal is **not** aborted,
 * preventing a brief loading-flicker when StrictMode triggers the second mount.
 *
 * @returns {@link UseProductsResult}
 *
 * @example
 * ```tsx
 * const { products, loading, error, committedSearch, submitSearch } = useProducts();
 *
 * // Pass to SearchBar:
 * <SearchBar onSearch={submitSearch} committedSearch={committedSearch} … />
 *
 * // Render the grid:
 * {products.map((p) => <PhoneCard key={p.id} product={p} />)}
 * ```
 */
export const useProducts = (): UseProductsResult => {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [committedSearch, setCommittedSearch] = useState('');

  useEffect(() => {
    // A new controller is created on every effect run so that a stale fetch
    // (from the previous committedSearch value) is always cancelled before the
    // new one begins.
    const controller = new AbortController();

    const loadProducts = async () => {
      const loadSpan = productsLogger.startSpan('load', {
        tags: [committedSearch ? 'search-results' : 'catalog-initial-load'],
        context: { committedSearch },
      });

      setLoading(true);
      setError(null);

      try {
        // No params → fetchProducts applies the default limit:20 rule.
        // With a search term → no limit, returns all matches.
        const params = committedSearch ? { search: committedSearch } : undefined;
        const data = await fetchProducts(params, controller.signal);

        setProducts(data);
        loadSpan.finish({ tags: ['success'], context: { resultCount: data.length } });
      } catch (err) {
        // AbortError means the effect was cleaned up before the response
        // arrived — this is expected and should NOT surface as a UI error.
        if (err instanceof DOMException && err.name === 'AbortError') return;

        const appError = ErrorFactory.productsLoadFailed(err);
        setError(getErrorMessage(appError));
        loadSpan.fail(err, { tags: ['error'], context: { committedSearch } });
        logError(err, 'useProducts.loadProducts');
      } finally {
        // Only clear the loading flag if the effect was NOT aborted.
        // Skipping this when aborted prevents a flicker where loading briefly
        // goes false between the first and second StrictMode mounts.
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadProducts().catch((err) => {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      logError(err, 'useProducts.useEffect');
    });

    // Cleanup: abort the in-flight request when deps change or on unmount.
    return () => controller.abort();
  }, [committedSearch]);

  /**
   * Stable reference (via `useCallback`) so consumers (e.g. `SearchBar`) can
   * safely pass it as a prop without causing infinite re-render loops.
   */
  const submitSearch = useCallback((term: string) => {
    setCommittedSearch(term.trim());
  }, []);

  return { products, loading, error, committedSearch, submitSearch, resultCount: products.length };
};
