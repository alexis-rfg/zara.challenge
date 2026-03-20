import { useState, useEffect } from 'react';
import { getProductById } from '@/api/products.api';
import type { ProductDetail } from '@/types/product.types';

/**
 * Result object returned by the useProductDetail hook.
 */
type UseProductDetailResult = {
  /** The fetched product details, or null if not loaded or error occurred */
  product: ProductDetail | null;
  /** Loading state indicator */
  loading: boolean;
  /** Error message if fetch fails, null otherwise */
  error: string | null;
};

/**
 * Custom hook for fetching and managing product detail state.
 *
 * Handles loading state, error handling, and cleanup for product detail fetching.
 * Automatically refetches when the product ID changes. Includes cancellation
 * logic to prevent state updates after unmount.
 *
 * @param id - The product ID to fetch details for (optional)
 * @returns Object containing product details, loading state, and error state
 *
 * @example
 * ```tsx
 * const { product, loading, error } = useProductDetail(productId);
 *
 * if (loading) return <Spinner />;
 * if (error) return <Error message={error} />;
 * if (!product) return <NotFound />;
 *
 * return <ProductDetails product={product} />;
 * ```
 */
export function useProductDetail(id: string | undefined): UseProductDetailResult {
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError('No product ID provided');
      return;
    }

    let cancelled = false;

    async function fetchProduct(productId: string) {
      setLoading(true);
      setError(null);

      try {
        const data = await getProductById(productId);
        if (!cancelled) setProduct(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchProduct(id);

    return () => {
      cancelled = true;
    };
  }, [id]);

  return { product, loading, error };
}
