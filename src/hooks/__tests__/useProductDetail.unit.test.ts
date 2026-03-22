import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useProductDetail } from '../useProductDetail';
import * as productsApi from '@/api/products.api';
import productDetailsFixtures from '@/test/fixtures/productDetails.json';

vi.mock('@/api/products.api', () => ({
  getProductById: vi.fn(),
}));

const mockProduct = productDetailsFixtures.iPhone15;

describe('useProductDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts in loading state', () => {
    vi.mocked(productsApi.getProductById).mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => useProductDetail('APL-IP15'));

    expect(result.current.loading).toBe(true);
    expect(result.current.product).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('returns product on successful fetch', async () => {
    vi.mocked(productsApi.getProductById).mockResolvedValue(mockProduct);

    const { result } = renderHook(() => useProductDetail('APL-IP15'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.product).toEqual(mockProduct);
    expect(result.current.error).toBeNull();
  });

  it('sets error message when fetch fails', async () => {
    vi.mocked(productsApi.getProductById).mockRejectedValue(new Error('Not found'));

    const { result } = renderHook(() => useProductDetail('APL-IP15'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.product).toBeNull();
    expect(result.current.error).toBe('Not found');
  });

  it('sets generic error for non-Error rejections', async () => {
    vi.mocked(productsApi.getProductById).mockRejectedValue('string error');

    const { result } = renderHook(() => useProductDetail('APL-IP15'));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('Failed to load product');
  });

  it('sets error immediately when id is undefined', async () => {
    const { result } = renderHook(() => useProductDetail(undefined));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe('No product ID provided');
    expect(result.current.product).toBeNull();
    expect(productsApi.getProductById).not.toHaveBeenCalled();
  });

  it('silently ignores AbortError', async () => {
    const abortError = new DOMException('Aborted', 'AbortError');
    vi.mocked(productsApi.getProductById).mockRejectedValue(abortError);

    const { result } = renderHook(() => useProductDetail('APL-IP15'));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeNull();
  });

  it('calls getProductById with the provided id', async () => {
    vi.mocked(productsApi.getProductById).mockResolvedValue(mockProduct);

    renderHook(() => useProductDetail('SMG-S24'));

    await waitFor(() =>
      expect(productsApi.getProductById).toHaveBeenCalledWith('SMG-S24', expect.any(AbortSignal)),
    );
  });

  it('aborts in-flight request on unmount', () => {
    const abortSpy = vi.spyOn(AbortController.prototype, 'abort');
    vi.mocked(productsApi.getProductById).mockReturnValue(new Promise(() => {}));

    const { unmount } = renderHook(() => useProductDetail('APL-IP15'));
    unmount();

    expect(abortSpy).toHaveBeenCalled();
  });
});
