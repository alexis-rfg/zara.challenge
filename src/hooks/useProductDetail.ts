import { useState, useEffect } from 'react';
import { getProductById } from '@/api/products.api';
import type { ProductDetail } from '@/types/product.types';

type UseProductDetailResult = {
  product: ProductDetail | null;
  loading: boolean;
  error: string | null;
};

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
