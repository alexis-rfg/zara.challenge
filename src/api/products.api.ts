import type { ProductDetail, ProductSummary } from '@/types/product.types';
import { apiClient } from './client';

export const getProducts = async (params?: {
  search?: string;
  limit?: string;
  offset?: number;
}): Promise<ProductSummary[]> => {
  const queryParms = new URLSearchParams();
  if (params?.search) {
    queryParms.append('search', params.search);
  }
  if (params?.limit) {
    queryParms.append('limit', params.limit);
  }
  if (params?.offset) {
    queryParms.append('offset', params.offset.toString());
  }
  const query = queryParms.toString();
  const endpoint = query ? `/products?${query}` : '/products';
  return apiClient<ProductSummary[]>(endpoint);
};
export const getProductById = async (id: string): Promise<ProductDetail> => {
  return apiClient<ProductDetail>(`/products/${id}`);
};
