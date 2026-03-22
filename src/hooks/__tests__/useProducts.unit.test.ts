import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useProducts } from '../useProducts';
import * as productService from '@/services/product.service';
import productFixtures from '@/test/fixtures/products.json';

vi.mock('@/services/product.service', () => ({
  fetchProducts: vi.fn(),
}));

vi.mock('@/utils/error.utils', () => ({
  ErrorFactory: {
    productsLoadFailed: vi.fn((err: unknown) => err),
  },
  getErrorMessage: vi.fn(() => 'Failed to load products. Please try again.'),
  logError: vi.fn(),
}));

vi.mock('@/utils/logger', () => ({
  createLogger: () => ({
    startSpan: () => ({ finish: vi.fn(), fail: vi.fn() }),
    error: vi.fn(),
    info: vi.fn(),
  }),
}));

const mockProducts = [productFixtures.galaxyS24, productFixtures.iPhone15];

describe('useProducts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts in loading state', () => {
    vi.mocked(productService.fetchProducts).mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useProducts());

    expect(result.current.loading).toBe(true);
    expect(result.current.products).toEqual([]);
  });

  it('returns products on successful fetch', async () => {
    vi.mocked(productService.fetchProducts).mockResolvedValue(mockProducts);

    const { result } = renderHook(() => useProducts());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.products).toEqual(mockProducts);
    expect(result.current.error).toBeNull();
    expect(result.current.resultCount).toBe(2);
  });

  it('sets error on failed fetch', async () => {
    vi.mocked(productService.fetchProducts).mockRejectedValue(new Error('Network failure'));

    const { result } = renderHook(() => useProducts());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Failed to load products. Please try again.');
    expect(result.current.products).toEqual([]);
  });

  it('initial fetch has no search params (uses limit:20 via service)', async () => {
    vi.mocked(productService.fetchProducts).mockResolvedValue(mockProducts);

    renderHook(() => useProducts());

    await waitFor(() =>
      expect(productService.fetchProducts).toHaveBeenCalledWith(undefined, expect.any(AbortSignal)),
    );
  });

  it('submitSearch triggers a new fetch with the search term', async () => {
    vi.mocked(productService.fetchProducts).mockResolvedValue(mockProducts);

    const { result } = renderHook(() => useProducts());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.submitSearch('Samsung');
    });

    await waitFor(() =>
      expect(productService.fetchProducts).toHaveBeenCalledWith(
        { search: 'Samsung' },
        expect.any(AbortSignal),
      ),
    );
  });

  it('submitSearch trims whitespace from the search term', async () => {
    vi.mocked(productService.fetchProducts).mockResolvedValue(mockProducts);

    const { result } = renderHook(() => useProducts());
    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.submitSearch('  Apple  ');
    });

    await waitFor(() => expect(result.current.committedSearch).toBe('Apple'));
  });

  it('committedSearch starts empty', async () => {
    vi.mocked(productService.fetchProducts).mockResolvedValue([]);

    const { result } = renderHook(() => useProducts());

    expect(result.current.committedSearch).toBe('');
    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('silently ignores AbortError', async () => {
    const abortError = new DOMException('Aborted', 'AbortError');
    vi.mocked(productService.fetchProducts).mockRejectedValue(abortError);

    const { result } = renderHook(() => useProducts());

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeNull();
  });

  it('aborts in-flight request on unmount', () => {
    const abortSpy = vi.spyOn(AbortController.prototype, 'abort');
    vi.mocked(productService.fetchProducts).mockReturnValue(new Promise(() => {}));

    const { unmount } = renderHook(() => useProducts());
    unmount();

    expect(abortSpy).toHaveBeenCalled();
  });
});
