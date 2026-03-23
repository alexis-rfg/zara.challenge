import type { ImgHTMLAttributes } from 'react';
import type { ProductSummary, ColorOption, StorageOption } from './product.types';
import type { FilterColor } from './hooks.types';

/** Props for the SearchBar component. */
export type SearchBarProps = {
  /** Called when the user submits via Enter or clears the input. */
  onSearch: (term: string) => void;
  /** The term currently driving the rendered result set. */
  committedSearch: string;
  /** Number of items in the current result set. */
  resultCount: number;
  /** Whether the result set is currently loading. */
  loading?: boolean;
  /** Whether the search input should be temporarily non-interactive. */
  disabled?: boolean;
};

/** Props for the mobile ColorFilter component. */
export type ColorFilterProps = {
  /** Number of products currently displayed after filtering. */
  resultCount: number;
  /** Whether the product list is loading. */
  loading: boolean;
  /** Whether the swatch panel is open. */
  isOpen: boolean;
  /** Whether color data is being fetched. */
  isFilterLoading: boolean;
  /** Unique colors available in the catalog. */
  availableColors: FilterColor[];
  /** Currently selected color hex code. */
  selectedColor: string | null;
  /** Number of active color filters. */
  activeCount: number;
  /** Opens the filter panel. */
  onOpen: () => void;
  /** Closes the filter panel. */
  onClose: () => void;
  /** Selects a color by hex code. */
  onSelect: (hexCode: string) => void;
  /** Clears the active color filter. */
  onClear: () => void;
};

/** Props for the ColorSelector component. */
export type ColorSelectorProps = {
  /** Array of available color options. */
  colors: ColorOption[];
  /** Index of the currently selected color. */
  selectedIndex: number | null;
  /** Callback fired when a color is selected. */
  onSelect: (index: number) => void;
};

/** Props for the LazyImage component. */
export type LazyImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  /** When true, disables lazy loading for above-the-fold images. */
  eager?: boolean;
};

/** Props for the PhoneCard component. */
export type PhoneCardProps = {
  /** Product summary data displayed in the card. */
  product: ProductSummary;
  /** Heading tag used for the product name to preserve semantic hierarchy. */
  headingTag?: 'h2' | 'h3';
  /** Promotes above-the-fold catalog images for faster initial rendering. */
  eagerImage?: boolean;
};

/** Props for the SimilarProducts component. */
export type SimilarProductsProps = {
  /** Similar product summaries rendered in the carousel. */
  products: ProductSummary[];
};

/** Props for the StorageSelector component. */
export type StorageSelectorProps = {
  /** Storage options available for the current product. */
  options: StorageOption[];
  /** Index of the currently selected storage option. */
  selectedIndex: number | null;
  /** Callback fired when a storage option is selected. */
  onSelect: (index: number) => void;
};
