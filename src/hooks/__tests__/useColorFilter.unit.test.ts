import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useColorFilter } from '../useColorFilter';
import * as productsApi from '@/api/products.api';
import productFixtures from '@/test/fixtures/products.json';
import productDetailsFixtures from '@/test/fixtures/productDetails.json';

vi.mock('@/api/products.api', () => ({
  getProducts: vi.fn(),
  getProductById: vi.fn(),
}));

const mockSummaries = [productFixtures.galaxyS24, productFixtures.iPhone15];

describe('useColorFilter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(productsApi.getProducts).mockResolvedValue(mockSummaries);
    vi.mocked(productsApi.getProductById)
      .mockResolvedValueOnce(productDetailsFixtures.galaxyS24)
      .mockResolvedValueOnce(productDetailsFixtures.iPhone15);
  });

  it('starts with empty state and panel closed', () => {
    const { result } = renderHook(() => useColorFilter());

    expect(result.current.isOpen).toBe(false);
    expect(result.current.selectedColor).toBeNull();
    expect(result.current.availableColors).toEqual([]);
    expect(result.current.activeCount).toBe(0);
    expect(result.current.isLoading).toBe(false);
  });

  it('open() sets isOpen to true', async () => {
    const { result } = renderHook(() => useColorFilter());

    await act(() => {
      result.current.open();
      return Promise.resolve();
    });

    expect(result.current.isOpen).toBe(true);
  });

  it('close() sets isOpen to false', async () => {
    const { result } = renderHook(() => useColorFilter());

    await act(() => {
      result.current.open();
      result.current.close();
      return Promise.resolve();
    });

    expect(result.current.isOpen).toBe(false);
  });

  it('select() sets selected color and closes panel', async () => {
    const { result } = renderHook(() => useColorFilter());

    await act(() => {
      result.current.open();
      result.current.select('#000000');
      return Promise.resolve();
    });

    expect(result.current.selectedColor).toBe('#000000');
    expect(result.current.isOpen).toBe(false);
    expect(result.current.activeCount).toBe(1);
  });

  it('clear() resets selectedColor', async () => {
    const { result } = renderHook(() => useColorFilter());

    await act(() => {
      result.current.select('#000000');
      return Promise.resolve();
    });

    await act(() => {
      result.current.clear();
      return Promise.resolve();
    });

    expect(result.current.selectedColor).toBeNull();
    expect(result.current.activeCount).toBe(0);
  });

  it('open() triggers fetch and populates availableColors', async () => {
    const { result } = renderHook(() => useColorFilter());

    act(() => {
      result.current.open();
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Galaxy S24: #000000, #FFFFFF — iPhone 15: #1C1C1E, #5E6B8B — all 4 are distinct hex codes
    expect(result.current.availableColors.length).toBe(4);
    const hexCodes = result.current.availableColors.map((c) => c.hexCode);
    expect(hexCodes).toContain(productDetailsFixtures.galaxyS24.colorOptions.at(0)?.hexCode); // Black
    expect(hexCodes).toContain(productDetailsFixtures.galaxyS24.colorOptions.at(1)?.hexCode); // White
    expect(hexCodes).toContain(productDetailsFixtures.iPhone15.colorOptions.at(1)?.hexCode); // Blue
  });

  it('does NOT fetch again on subsequent opens (caches data)', async () => {
    const { result } = renderHook(() => useColorFilter());

    act(() => {
      result.current.open();
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.close();
      result.current.open();
    });

    expect(productsApi.getProducts).toHaveBeenCalledTimes(1);
  });

  it('filterProducts returns all products when no color selected', () => {
    const { result } = renderHook(() => useColorFilter());

    const filtered = result.current.filterProducts(mockSummaries);

    expect(filtered).toEqual(mockSummaries);
  });

  it('filterProducts filters products by selected color after data loads', async () => {
    const { result } = renderHook(() => useColorFilter());

    act(() => {
      result.current.open();
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const blueHex = productDetailsFixtures.iPhone15.colorOptions.at(1)?.hexCode ?? ''; // Blue — only iPhone 15

    act(() => {
      result.current.select(blueHex);
    });

    const filtered = result.current.filterProducts(mockSummaries);

    expect(filtered).toHaveLength(1);
    expect(filtered.at(0)?.id).toBe(productFixtures.iPhone15.id);
  });

  it('filterProducts swaps imageUrl to color-specific one', async () => {
    const { result } = renderHook(() => useColorFilter());

    act(() => {
      result.current.open();
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const blueOption = productDetailsFixtures.iPhone15.colorOptions.find((c) => c.name === 'Blue');

    act(() => {
      result.current.select(blueOption?.hexCode ?? '');
    });

    const filtered = result.current.filterProducts(mockSummaries);

    expect(filtered.at(0)?.imageUrl).toBe(blueOption?.imageUrl);
  });

  it('aborts ongoing fetch on unmount', () => {
    const abortSpy = vi.spyOn(AbortController.prototype, 'abort');
    vi.mocked(productsApi.getProducts).mockReturnValue(new Promise(() => {}));

    const { result, unmount } = renderHook(() => useColorFilter());

    act(() => {
      result.current.open();
    });

    unmount();

    expect(abortSpy).toHaveBeenCalled();
  });

  it('silently handles API errors without crashing', async () => {
    vi.mocked(productsApi.getProducts).mockRejectedValue(new Error('API down'));

    const { result } = renderHook(() => useColorFilter());

    act(() => {
      result.current.open();
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.availableColors).toEqual([]);
  });

  it('keeps the palette available when one product detail fails', async () => {
    vi.mocked(productsApi.getProductById)
      .mockReset()
      .mockResolvedValueOnce(productDetailsFixtures.galaxyS24)
      .mockRejectedValueOnce(new Error('Malformed product detail'));

    const { result } = renderHook(() => useColorFilter());

    act(() => {
      result.current.open();
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.availableColors).toEqual([
      {
        name: productDetailsFixtures.galaxyS24.colorOptions[0]?.name ?? '',
        hexCode: productDetailsFixtures.galaxyS24.colorOptions[0]?.hexCode ?? '',
      },
      {
        name: productDetailsFixtures.galaxyS24.colorOptions[1]?.name ?? '',
        hexCode: productDetailsFixtures.galaxyS24.colorOptions[1]?.hexCode ?? '',
      },
    ]);
  });
});
