import type {
  ColorOption,
  ProductDetail,
  ProductSpecs,
  ProductSummary,
  StorageOption,
} from '@/types/product.types';
import { toSecureAssetUrl } from '@/utils/urlSecurity';

const INVALID_PRODUCT_RESPONSE = 'Invalid product API response';

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const expectRecord = (value: unknown, fieldPath: string): Record<string, unknown> => {
  if (!isRecord(value)) {
    throw new Error(`${INVALID_PRODUCT_RESPONSE}: ${fieldPath} must be an object`);
  }

  return value;
};

const expectArray = (value: unknown, fieldPath: string): unknown[] => {
  if (!Array.isArray(value)) {
    throw new Error(`${INVALID_PRODUCT_RESPONSE}: ${fieldPath} must be an array`);
  }

  return value;
};

const expectString = (value: unknown, fieldPath: string): string => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`${INVALID_PRODUCT_RESPONSE}: ${fieldPath} must be a non-empty string`);
  }

  return value.trim();
};

const expectNumber = (value: unknown, fieldPath: string): number => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${INVALID_PRODUCT_RESPONSE}: ${fieldPath} must be a finite number`);
  }

  return value;
};

const parseProductSummary = (value: unknown, fieldPath: string): ProductSummary => {
  const record = expectRecord(value, fieldPath);

  return {
    id: expectString(record.id, `${fieldPath}.id`),
    brand: expectString(record.brand, `${fieldPath}.brand`),
    name: expectString(record.name, `${fieldPath}.name`),
    basePrice: expectNumber(record.basePrice, `${fieldPath}.basePrice`),
    imageUrl: toSecureAssetUrl(expectString(record.imageUrl, `${fieldPath}.imageUrl`)),
  };
};

const parseProductSpecs = (value: unknown, fieldPath: string): ProductSpecs => {
  const record = expectRecord(value, fieldPath);

  return {
    screen: expectString(record.screen, `${fieldPath}.screen`),
    resolution: expectString(record.resolution, `${fieldPath}.resolution`),
    processor: expectString(record.processor, `${fieldPath}.processor`),
    mainCamera: expectString(record.mainCamera, `${fieldPath}.mainCamera`),
    selfieCamera: expectString(record.selfieCamera, `${fieldPath}.selfieCamera`),
    battery: expectString(record.battery, `${fieldPath}.battery`),
    os: expectString(record.os, `${fieldPath}.os`),
    screenRefreshRate: expectString(record.screenRefreshRate, `${fieldPath}.screenRefreshRate`),
  };
};

const parseColorOption = (value: unknown, fieldPath: string): ColorOption => {
  const record = expectRecord(value, fieldPath);

  return {
    name: expectString(record.name, `${fieldPath}.name`),
    hexCode: expectString(record.hexCode, `${fieldPath}.hexCode`),
    imageUrl: toSecureAssetUrl(expectString(record.imageUrl, `${fieldPath}.imageUrl`)),
  };
};

const parseStorageOption = (value: unknown, fieldPath: string): StorageOption => {
  const record = expectRecord(value, fieldPath);

  return {
    capacity: expectString(record.capacity, `${fieldPath}.capacity`),
    price: expectNumber(record.price, `${fieldPath}.price`),
  };
};

export const parseProductsResponse = (value: unknown): ProductSummary[] => {
  return expectArray(value, 'products').map((product, index) => {
    return parseProductSummary(product, `products[${index}]`);
  });
};

export const parseProductDetailResponse = (value: unknown): ProductDetail => {
  const record = expectRecord(value, 'product');

  return {
    id: expectString(record.id, 'product.id'),
    brand: expectString(record.brand, 'product.brand'),
    name: expectString(record.name, 'product.name'),
    description: expectString(record.description, 'product.description'),
    basePrice: expectNumber(record.basePrice, 'product.basePrice'),
    rating: expectNumber(record.rating, 'product.rating'),
    specs: parseProductSpecs(record.specs, 'product.specs'),
    colorOptions: expectArray(record.colorOptions, 'product.colorOptions').map((option, index) => {
      return parseColorOption(option, `product.colorOptions[${index}]`);
    }),
    storageOptions: expectArray(record.storageOptions, 'product.storageOptions').map(
      (option, index) => {
        return parseStorageOption(option, `product.storageOptions[${index}]`);
      },
    ),
    similarProducts: expectArray(record.similarProducts, 'product.similarProducts').map(
      (product, index) => {
        return parseProductSummary(product, `product.similarProducts[${index}]`);
      },
    ),
  };
};
