import { useState, useEffect } from 'react';
import { useDebounce } from './useDebounce';
import { fetchProducts } from '@/services/product.service';
import { ErrorFactory, getErrorMessage, logError } from '@/utils/error.utils';
import { createLogger } from '@/utils/logger';
import type { ProductSummary } from '@/types/product.types';

const productsLogger = createLogger({
  scope: 'products.list',
  tags: ['products', 'search'],
});

/**
 * Result object returned by the useProducts hook
 */
type UseProductsResult = {
  /** Array of product summaries */
  products: ProductSummary[];
  /** Loading state indicator */
  loading: boolean;
  /** Error message if fetch fails, null otherwise */
  error: string | null;
  /** Current search term value */
  searchTerm: string;
  /** Function to update the search term */
  setSearchTerm: (term: string) => void;
  /** Number of products in the current result set */
  resultCount: number;
};

/**
 * Custom hook for managing product list state with search functionality.
 *
 * Provides debounced search capabilities and handles loading/error states
 * for product fetching operations. When no search term is provided, fetches
 * a default set of products.
 *
 * @returns {UseProductsResult} Object containing products, loading state, error state, and search controls
 *
 * @example
 * ```tsx
 * const { products, loading, error, searchTerm, setSearchTerm } = useProducts();
 *
 * return (
 *   <div>
 *     <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
 *     {loading && <p>Loading...</p>}
 *     {error && <p>Error: {error}</p>}
 *     {products.map(product => <ProductCard key={product.id} {...product} />)}
 *   </div>
 * );
 * ```
 */
export const useProducts = (): UseProductsResult => {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const debouncedSearch = useDebounce(searchTerm, 400);

  useEffect(() => {
    const loadProducts = async () => {
      const loadSpan = productsLogger.startSpan('load', {
        tags: [debouncedSearch ? 'search-results' : 'catalog-initial-load'],
        context: {
          rawSearchTerm: searchTerm,
          debouncedSearchTerm: debouncedSearch,
        },
      });

      setLoading(true);
      setError(null);

      try {
        const data = await fetchProducts(debouncedSearch ? { search: debouncedSearch } : undefined);
        setProducts(data);
        loadSpan.finish({
          tags: ['success'],
          context: {
            resultCount: data.length,
          },
        });
      } catch (err) {
        const appError = ErrorFactory.productsLoadFailed(err);
        setError(getErrorMessage(appError));
        loadSpan.fail(err, {
          tags: ['error'],
          context: {
            rawSearchTerm: searchTerm,
            debouncedSearchTerm: debouncedSearch,
          },
        });
        logError(err, 'useProducts.loadProducts');
      } finally {
        setLoading(false);
      }
    };

    loadProducts().catch((err) => {
      logError(err, 'useProducts.useEffect');
    });
  }, [debouncedSearch, searchTerm]);

  return {
    products,
    loading,
    error,
    searchTerm,
    setSearchTerm,
    resultCount: products.length,
  };
};
