import { useState, useEffect, useCallback } from 'react';
import { fetchProducts } from '@/services/product.service';
import { ErrorFactory, getErrorMessage, logError } from '@/utils/error.utils';
import { createLogger } from '@/utils/logger';
import type { ProductSummary } from '@/types/product.types';
import type { UseProductsResult } from '@/types/hooks.types';

const productsLogger = createLogger({
  scope: 'products.list',
  tags: ['products', 'search'],
});

/**
 * Manages the product list for the home page, including initial load and on-demand search.
 *
 * @returns Product-list view model for the phone list page.
 */
export const useProducts = (): UseProductsResult => {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [committedSearch, setCommittedSearch] = useState('');

  useEffect(() => {
    const controller = new AbortController();

    /**
     * Fetches the product list for the current committed search term.
     */
    const loadProducts = async () => {
      const loadSpan = productsLogger.startSpan('load', {
        tags: [committedSearch ? 'search-results' : 'catalog-initial-load'],
        context: { committedSearch },
      });

      setLoading(true);
      setError(null);

      try {
        const params = committedSearch ? { search: committedSearch } : undefined;
        const data = await fetchProducts(params, controller.signal);

        setProducts(data);
        loadSpan.finish({ tags: ['success'], context: { resultCount: data.length } });
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;

        const appError = ErrorFactory.productsLoadFailed(err);
        setError(getErrorMessage(appError));
        loadSpan.fail(err, { tags: ['error'], context: { committedSearch } });
        logError(err, 'useProducts.loadProducts');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void loadProducts().catch((err) => {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      logError(err, 'useProducts.useEffect');
    });

    return () => controller.abort();
  }, [committedSearch]);

  /**
   * Stores the latest submitted search term after trimming user whitespace.
   *
   * @param term - Raw term submitted from the search UI.
   */
  const submitSearch = useCallback((term: string) => {
    setCommittedSearch(term.trim());
  }, []);

  return { products, loading, error, committedSearch, submitSearch, resultCount: products.length };
};
