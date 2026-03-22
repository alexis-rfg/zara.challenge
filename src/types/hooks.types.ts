import type { ProductDetail, ProductSummary } from './product.types';

/** Unique color metadata extracted from catalog product details. */
export type FilterColor = {
  /** Human-readable color name. */
  name: string;
  /** Hex code representing the swatch color. */
  hexCode: string;
};

/** Shape returned by the useColorFilter hook. */
export type UseColorFilterResult = {
  /** Unique colors available across the catalog. */
  availableColors: FilterColor[];
  /** Currently selected color hex code. */
  selectedColor: string | null;
  /** Whether the filter panel is open. */
  isOpen: boolean;
  /** Whether filter metadata is currently loading. */
  isLoading: boolean;
  /** Number of active filters. */
  activeCount: number;
  /** Opens the filter panel. */
  open: () => void;
  /** Closes the filter panel. */
  close: () => void;
  /** Selects a color by hex code. */
  select: (hexCode: string) => void;
  /** Clears the selected color. */
  clear: () => void;
  /** Filters and decorates products by the selected color. */
  filterProducts: (products: ProductSummary[]) => ProductSummary[];
};

/** Shape returned by the useProductDetail hook. */
export type UseProductDetailResult = {
  /** Resolved product detail record, or null while unavailable. */
  product: ProductDetail | null;
  /** Whether the detail request is in progress. */
  loading: boolean;
  /** Human-readable error message for the current request. */
  error: string | null;
};

/** Shape returned by the useProducts hook. */
export type UseProductsResult = {
  /** Current list of products matching the committed search. */
  products: ProductSummary[];
  /** Whether a fetch is currently in progress. */
  loading: boolean;
  /** Human-readable error message for the current request. */
  error: string | null;
  /** Last search term submitted to the API. */
  committedSearch: string;
  /** Submits a search term to the API. */
  submitSearch: (term: string) => void;
  /** Number of products in the current result set. */
  resultCount: number;
};
