export type ProductSummary = {
  id: string;
  brand: string;
  name: string;
  basePrice: number;
  imageUrl: string;
};

export type ProductSpecs = {
  screen: string;
  resolution: string;
  processor: string;
  mainCamera: string;
  selfieCamera: string;
  battery: string;
  os: string;
  screenRefreshRate: string;
};

export type ColorOption = {
  name: string;
  hexCode: string;
  imageUrl: string;
};

export type StorageOption = {
  capacity: string;
  price: number;
};

export type ProductDetail = {
  id: string;
  brand: string;
  name: string;
  description: string;
  basePrice: number;
  rating: number;
  specs: ProductSpecs;
  colorOptions: ColorOption[];
  storageOptions: StorageOption[];
  similarProducts: ProductSummary[];
};

export type CartItem = {
  id: string;
  name: string;
  brand: string;
  imageUrl: string;
  colorName: string;
  storageCapacity: string;
  price: number;
};
