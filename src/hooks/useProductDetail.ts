import { useState, useEffect } from 'react';
import { fetchProductDetail } from '@/services/product.service';
import { createLogger } from '@/utils/logger';
import type { ProductDetail } from '@/types/product.types';
import type { UseProductDetailResult } from '@/types/hooks.types';

const productDetailLogger = createLogger({
  scope: 'products.detail',
  tags: ['products', 'detail'],
});

/**
 * Fetches and manages the full detail record for a single product.
 *
 * @param id - Product identifier from the route params.
 * @returns Product-detail view model.
 */
export function useProductDetail(id: string | undefined): UseProductDetailResult {
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      productDetailLogger.warn('missing_product_id');
      setLoading(false);
      setError('No product ID provided');
      return;
    }

    const controller = new AbortController();

    /**
     * Fetches the product detail for the current route id.
     *
     * @param productId - Product identifier to request.
     */
    const fetchProduct = async (productId: string) => {
      const loadSpan = productDetailLogger.startSpan('load', {
        context: { productId },
      });

      setLoading(true);
      setError(null);

      try {
        const data = await fetchProductDetail(productId, controller.signal);
        setProduct(data);
        loadSpan.finish({
          tags: ['success'],
          context: {
            productId: data.id,
            similarProductsCount: data.similarProducts.length,
          },
        });
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          productDetailLogger.debug('load_aborted', {
            context: { productId },
          });
          return;
        }

        loadSpan.fail(err, {
          tags: ['error'],
          context: { productId },
        });
        setError(err instanceof Error ? err.message : 'Failed to load product');
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    void fetchProduct(id);

    return () => controller.abort();
  }, [id]);

  return { product, loading, error };
}
