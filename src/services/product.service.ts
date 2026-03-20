import { getProducts } from '@/api/products.api';
import type { ProductSummary } from '@/types/product.types';

export type FetchProductsParams = {
  search?: string;
  limit?: string;
};

export const fetchProducts = async (params?: FetchProductsParams): Promise<ProductSummary[]> => {
  const defaultParams = params?.search ? { search: params.search } : { limit: '20' };
  return getProducts(defaultParams);
};
