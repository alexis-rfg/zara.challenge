import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchProducts } from '../product.service';
import * as productsApi from '@/api/products.api';
import productFixtures from '@/test/fixtures/products.json';

vi.mock('@/api/products.api', () => ({
  getProducts: vi.fn(),
}));

const mockProducts = [productFixtures.galaxyS24, productFixtures.iPhone15];

describe('fetchProducts (product.service)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(productsApi.getProducts).mockResolvedValue(mockProducts);
  });

  it('calls getProducts with limit:20 when no params provided', async () => {
    await fetchProducts();

    expect(productsApi.getProducts).toHaveBeenCalledWith({ limit: '20' }, undefined);
  });

  it('calls getProducts with limit:20 when empty params provided', async () => {
    await fetchProducts({});

    expect(productsApi.getProducts).toHaveBeenCalledWith({ limit: '20' }, undefined);
  });

  it('calls getProducts with search param when search is provided', async () => {
    await fetchProducts({ search: 'Samsung' });

    expect(productsApi.getProducts).toHaveBeenCalledWith({ search: 'Samsung' }, undefined);
  });

  it('does NOT include limit when search is provided', async () => {
    await fetchProducts({ search: 'Apple' });

    const call = vi.mocked(productsApi.getProducts).mock.calls[0][0];
    expect(call).not.toHaveProperty('limit');
  });

  it('forwards AbortSignal to getProducts', async () => {
    const controller = new AbortController();
    await fetchProducts(undefined, controller.signal);

    expect(productsApi.getProducts).toHaveBeenCalledWith({ limit: '20' }, controller.signal);
  });

  it('returns the products from getProducts', async () => {
    const result = await fetchProducts();
    expect(result).toEqual(mockProducts);
  });
});
