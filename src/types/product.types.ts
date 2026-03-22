/**
 * Lightweight product representation returned by `GET /products`.
 * Contains only the fields needed to render a catalog card.
 */
export type ProductSummary = {
  /** Unique product identifier (e.g. `'APL-IP15P'`). */
  id: string;
  /** Manufacturer name (e.g. `'Apple'`). */
  brand: string;
  /** Model name (e.g. `'iPhone 15 Pro'`). */
  name: string;
  /** Lowest available price in EUR (before storage selection). */
  basePrice: number;
  /** Absolute URL to the default product image. May use `http://` — see CLAUDE.md §10. */
  imageUrl: string;
};

/**
 * Technical specification fields included in a product detail record.
 * All 8 fields are displayed in the "SPECIFICATIONS" table on the detail page.
 */
export type ProductSpecs = {
  /** Display technology and size (e.g. `'6.8" Dynamic AMOLED 2X'`). */
  screen: string;
  /** Native display resolution (e.g. `'3120 x 1440 pixels'`). */
  resolution: string;
  /** CPU model (e.g. `'Snapdragon 8 Gen 3'`). */
  processor: string;
  /** Rear camera configuration (e.g. `'200 MP + 12 MP + 10 MP'`). */
  mainCamera: string;
  /** Front-facing camera spec (e.g. `'12 MP'`). */
  selfieCamera: string;
  /** Battery capacity (e.g. `'5000 mAh'`). */
  battery: string;
  /** Operating system (e.g. `'Android 14'`). */
  os: string;
  /** Display refresh rate (e.g. `'120 Hz'`). */
  screenRefreshRate: string;
};

/**
 * A single colour variant for a product.
 * Selecting a colour updates the main hero image to `imageUrl`.
 */
export type ColorOption = {
  /** Human-readable colour name shown in the selector (e.g. `'Titanium Violet'`). */
  name: string;
  /** CSS hex colour used to render the swatch (e.g. `'#8E6F96'`). */
  hexCode: string;
  /** Colour-specific product image URL. Updates the hero image when selected. */
  imageUrl: string;
};

/**
 * A single storage tier for a product.
 * All tiers are shown simultaneously so users can compare prices before selecting.
 */
export type StorageOption = {
  /** Storage size label (e.g. `'256 GB'`). */
  capacity: string;
  /** Tier-specific price in EUR. Overrides `basePrice` when this tier is selected. */
  price: number;
};

/**
 * Full product record returned by `GET /products/:id`.
 * Includes everything needed to render the detail page without additional API calls.
 */
export type ProductDetail = {
  /** Unique product identifier (e.g. `'APL-IP15P'`). */
  id: string;
  /** Manufacturer name. */
  brand: string;
  /** Model name. */
  name: string;
  /** Marketing description shown in the specs table. */
  description: string;
  /** Lowest available price in EUR (before storage selection). */
  basePrice: number;
  /** Average user rating (0–5). */
  rating: number;
  /** Full technical specification set. */
  specs: ProductSpecs;
  /** Available colour variants. Selecting one swaps the hero image. */
  colorOptions: ColorOption[];
  /** Available storage tiers. Selecting one updates the displayed price. */
  storageOptions: StorageOption[];
  /** Products shown in the "SIMILAR ITEMS" carousel. Already deduplicated by the API layer. */
  similarProducts: ProductSummary[];
};
