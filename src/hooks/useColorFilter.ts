import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { fetchAllProducts, fetchProductDetail } from '@/services/product.service';
import { createLogger } from '@/utils/logger';
import type { ProductSummary, ColorOption } from '@/types/product.types';
import type { FilterColor, UseColorFilterResult } from '@/types/hooks.types';

const colorFilterLogger = createLogger({
  scope: 'products.color-filter',
  tags: ['products', 'filter', 'color'],
});

/**
 * Manages the mobile color filter for the product catalog.
 *
 * @returns Color-filter view model for the product list page.
 */
export const useColorFilter = (): UseColorFilterResult => {
  const [availableColors, setAvailableColors] = useState<FilterColor[]>([]);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const colorMapRef = useRef<Map<string, ColorOption[]>>(new Map());
  const fetchedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  /**
   * Loads catalog-wide color metadata and caches it for future openings.
   */
  const fetchColorData = useCallback(async () => {
    if (fetchedRef.current) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const fetchSpan = colorFilterLogger.startSpan('load_palette', {
      tags: ['load'],
    });

    setIsLoading(true);

    try {
      const allProducts = await fetchAllProducts(controller.signal);
      const detailResults = await Promise.allSettled(
        allProducts.map((product) => fetchProductDetail(product.id, controller.signal)),
      );

      if (controller.signal.aborted) {
        colorFilterLogger.debug('load_palette_aborted');
        return;
      }

      const details = detailResults.flatMap((result) =>
        result.status === 'fulfilled' ? [result.value] : [],
      );
      const failedDetailCount = detailResults.length - details.length;

      if (details.length === 0) {
        fetchedRef.current = false;
        setAvailableColors([]);

        fetchSpan.fail(new Error('Color palette could not be built from product details'), {
          tags: ['error'],
          context: {
            productCount: allProducts.length,
            failedDetailCount,
          },
        });

        return;
      }

      if (failedDetailCount > 0) {
        colorFilterLogger.warn('load_palette_partial_failure', {
          tags: ['warning'],
          context: {
            productCount: allProducts.length,
            loadedDetailCount: details.length,
            failedDetailCount,
          },
        });
      }

      const colorMap = new Map<string, ColorOption[]>();
      const uniqueColors = new Map<string, FilterColor>();

      for (const detail of details) {
        colorMap.set(detail.id, detail.colorOptions);

        for (const color of detail.colorOptions) {
          if (!uniqueColors.has(color.hexCode)) {
            uniqueColors.set(color.hexCode, {
              name: color.name,
              hexCode: color.hexCode,
            });
          }
        }
      }

      colorMapRef.current = colorMap;
      setAvailableColors(Array.from(uniqueColors.values()));
      fetchedRef.current = true;

      fetchSpan.finish({
        tags: ['success'],
        context: {
          productCount: details.length,
          colorCount: uniqueColors.size,
          failedDetailCount,
        },
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        colorFilterLogger.debug('load_palette_aborted');
        return;
      }

      fetchSpan.fail(err, { tags: ['error'] });
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  /** Opens the filter panel and lazy-loads palette data on first access. */
  const open = useCallback(() => {
    setIsOpen(true);
    colorFilterLogger.debug('open_panel', {
      tags: ['interaction'],
      context: {
        hasCachedPalette: fetchedRef.current,
      },
    });

    if (!fetchedRef.current) {
      void fetchColorData();
    }
  }, [fetchColorData]);

  /** Closes the filter panel while keeping the current selection. */
  const close = useCallback(() => {
    setIsOpen(false);
    colorFilterLogger.debug('close_panel', {
      tags: ['interaction'],
    });
  }, []);

  /**
   * Applies a color filter by hex code and closes the panel.
   *
   * @param hexCode - Selected swatch hex code.
   */
  const select = useCallback((hexCode: string) => {
    setSelectedColor(hexCode);
    setIsOpen(false);
    colorFilterLogger.info('select_color', {
      tags: ['interaction'],
      context: {
        hexCode,
      },
    });
  }, []);

  /** Clears the active color filter selection. */
  const clear = useCallback(() => {
    setSelectedColor(null);
    colorFilterLogger.info('clear_color', {
      tags: ['interaction'],
    });
  }, []);

  /**
   * Filters products by the active color and swaps images to the color-specific asset.
   *
   * @param products - Source product list to filter.
   * @returns Filtered and image-adjusted product list.
   */
  const filterProducts = useCallback(
    (products: ProductSummary[]): ProductSummary[] => {
      if (!selectedColor) return products;

      return products
        .filter((product) => {
          const colors = colorMapRef.current.get(product.id) ?? [];
          return colors.some((color) => color.hexCode === selectedColor);
        })
        .map((product) => {
          const selectedOption = colorMapRef.current
            .get(product.id)
            ?.find((color) => color.hexCode === selectedColor);

          return selectedOption ? { ...product, imageUrl: selectedOption.imageUrl } : product;
        });
    },
    [selectedColor],
  );

  /** Derived active filter count used by the mobile filter badge. */
  const activeCount = useMemo(() => (selectedColor ? 1 : 0), [selectedColor]);

  return {
    availableColors,
    selectedColor,
    isOpen,
    isLoading,
    activeCount,
    open,
    close,
    select,
    clear,
    filterProducts,
  };
};
