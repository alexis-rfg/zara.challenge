import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getProductById, getProducts } from './products.api';
import { apiClient } from './client';
import type { ProductDetail, ProductSummary } from '@/types/product.types';

vi.mock('./client', () => ({
  apiClient: vi.fn(),
}));

const mockedApiClient = vi.mocked(apiClient);

describe('products.api', () => {
  beforeEach(() => {
    mockedApiClient.mockReset();
  });

  it('deduplicates repeated product ids in product lists', async () => {
    const duplicatedProducts: ProductSummary[] = [
      {
        id: 'XMI-RN13P5G',
        brand: 'Xiaomi',
        name: 'Redmi Note 13 Pro+ 5G',
        basePrice: 429,
        imageUrl: 'http://example.com/redmi-note-13-pro-plus.webp',
      },
      {
        id: 'XMI-RN13P5G',
        brand: 'Xiaomi',
        name: 'Redmi Note 13 Pro+ 5G',
        basePrice: 429,
        imageUrl: 'http://example.com/redmi-note-13-pro-plus.webp',
      },
      {
        id: 'APL-IP15P',
        brand: 'Apple',
        name: 'iPhone 15 Pro',
        basePrice: 1219,
        imageUrl: 'http://example.com/iphone-15-pro.webp',
      },
    ];

    mockedApiClient.mockResolvedValue(duplicatedProducts);

    const products = await getProducts({ search: 'pro' });

    expect(mockedApiClient).toHaveBeenCalledWith('/products?search=pro');
    expect(products).toEqual([duplicatedProducts[0], duplicatedProducts[2]]);
  });

  it('deduplicates repeated ids in similar products', async () => {
    const duplicateSimilarProduct: ProductSummary = {
      id: 'XMI-RN13P5G',
      brand: 'Xiaomi',
      name: 'Redmi Note 13 Pro+ 5G',
      basePrice: 429,
      imageUrl: 'http://example.com/redmi-note-13-pro-plus.webp',
    };

    const productDetail: ProductDetail = {
      id: 'SMG-S24U',
      brand: 'Samsung',
      name: 'Galaxy S24 Ultra',
      description: 'Flagship Android phone',
      basePrice: 1329,
      rating: 4.8,
      specs: {
        screen: '6.8" AMOLED',
        resolution: '3120 x 1440',
        processor: 'Snapdragon 8 Gen 3',
        mainCamera: '200 MP',
        selfieCamera: '12 MP',
        battery: '5000 mAh',
        os: 'Android 14',
        screenRefreshRate: '120 Hz',
      },
      colorOptions: [
        {
          name: 'Titanium Black',
          hexCode: '#2F2F2F',
          imageUrl: 'http://example.com/black.webp',
        },
      ],
      storageOptions: [
        {
          capacity: '256 GB',
          price: 1329,
        },
      ],
      similarProducts: [
        duplicateSimilarProduct,
        duplicateSimilarProduct,
        {
          id: 'GOO-P8P',
          brand: 'Google',
          name: 'Pixel 8 Pro',
          basePrice: 1099,
          imageUrl: 'http://example.com/pixel-8-pro.webp',
        },
      ],
    };

    mockedApiClient.mockResolvedValue(productDetail);

    const result = await getProductById('SMG-S24U');

    expect(mockedApiClient).toHaveBeenCalledWith('/products/SMG-S24U');
    expect(result.similarProducts).toEqual([
      duplicateSimilarProduct,
      productDetail.similarProducts[2],
    ]);
  });
});
