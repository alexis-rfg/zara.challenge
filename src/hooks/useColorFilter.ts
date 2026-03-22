import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { getProducts, getProductById } from '@/api/products.api';
import type { ProductSummary, ColorOption } from '@/types/product.types';

/**
 * A unique color extracted from the catalog's product details.
 */
export type FilterColor = {
  name: string;
  hexCode: string;
};

/**
 * Shape returned by {@link useColorFilter}.
 */
type UseColorFilterResult = {
  /** Unique colors available across all catalog products. */
  availableColors: FilterColor[];
  /** Currently selected color hex code, or `null` when no filter is active. */
  selectedColor: string | null;
  /** Whether the filter swatch panel is open. */
  isOpen: boolean;
  /** Whether color data is being fetched (first open only). */
  isLoading: boolean;
  /** Number of active color filters (0 or 1). */
  activeCount: number;
  /** Open the filter panel. Triggers a one-time data fetch on first open. */
  open: () => void;
  /** Close the panel without changing the selection. */
  close: () => void;
  /** Select a color by hex code and close the panel. */
  select: (hexCode: string) => void;
  /** Clear the active color filter. */
  clear: () => void;
  /** Returns a filtered copy of `products` that have the selected color. */
  filterProducts: (products: ProductSummary[]) => ProductSummary[];
};

/**
 * Manages a mobile color-filter for the product catalog.
 *
 * ### Data strategy
 * The list endpoint (`GET /products`) only returns {@link ProductSummary}
 * (no color data). Color options live in the detail endpoint
 * (`GET /products/:id`).
 *
 * On the **first** time the user opens the filter panel this hook:
 * 1. Fetches every product ID via `GET /products` (no limit).
 * 2. Fetches each product's detail in parallel to read `colorOptions`.
 * 3. Builds a `productId → colorName[]` map and a deduplicated list of
 *    unique colors (by `hexCode`).
 * 4. Caches the result — subsequent opens are instant.
 *
 * Once a color is selected, `filterProducts` does a synchronous client-side
 * filter against the cached map.
 *
 * @returns {@link UseColorFilterResult}
 */
export const useColorFilter = (): UseColorFilterResult => {
  const [availableColors, setAvailableColors] = useState<FilterColor[]>([]);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // productId → full color options (hex, name, imageUrl) for that product
  const colorMapRef = useRef<Map<string, ColorOption[]>>(new Map());
  const fetchedRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchColorData = useCallback(async () => {
    if (fetchedRef.current) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);

    try {
      // 1. Get ALL product IDs (no limit param → server returns full catalog)
      const allProducts = await getProducts({}, controller.signal);

      // 2. Fetch details in parallel to read colorOptions
      const details = await Promise.all(
        allProducts.map((p) => getProductById(p.id, controller.signal)),
      );

      // 3. Build maps
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
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      // Silently degrade — filter panel will be empty
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const open = useCallback(() => {
    setIsOpen(true);
    if (!fetchedRef.current) {
      void fetchColorData();
    }
  }, [fetchColorData]);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const select = useCallback((hexCode: string) => {
    setSelectedColor(hexCode);
    setIsOpen(false);
  }, []);

  const clear = useCallback(() => {
    setSelectedColor(null);
  }, []);

  const filterProducts = useCallback(
    (products: ProductSummary[]): ProductSummary[] => {
      if (!selectedColor) return products;
      return products
        .filter((p) => {
          const colors = colorMapRef.current.get(p.id) ?? [];
          return colors.some((c) => c.hexCode === selectedColor);
        })
        .map((p) => {
          const match = colorMapRef.current.get(p.id)?.find((c) => c.hexCode === selectedColor);
          // Swap the default image with the color-specific one
          return match ? { ...p, imageUrl: match.imageUrl } : p;
        });
    },
    [selectedColor],
  );

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
