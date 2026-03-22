import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getProductById, getProducts } from '../products.api';
import { apiClient } from '../client';
import type { ProductDetail, ProductSummary } from '@/types/product.types';

vi.mock('../client', () => ({
  apiClient: vi.fn(),
}));

const mockedApiClient = vi.mocked(apiClient);

describe('products.api', () => {
  beforeEach(() => {
    mockedApiClient.mockReset();
  });

  it('deduplicates repeated product ids in product lists', async () => {
    const duplicatedProducts = [
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

    expect(mockedApiClient).toHaveBeenCalledWith('/products?search=pro', undefined);
    expect(products).toEqual([
      {
        ...duplicatedProducts[0],
        imageUrl: 'https://example.com/redmi-note-13-pro-plus.webp',
      },
      {
        ...duplicatedProducts[2],
        imageUrl: 'https://example.com/iphone-15-pro.webp',
      },
    ]);
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

    expect(mockedApiClient).toHaveBeenCalledWith('/products/SMG-S24U', undefined);
    expect(result.similarProducts).toEqual([
      {
        ...duplicateSimilarProduct,
        imageUrl: 'https://example.com/redmi-note-13-pro-plus.webp',
      },
      {
        ...productDetail.similarProducts[2],
        imageUrl: 'https://example.com/pixel-8-pro.webp',
      },
    ]);
  });

  it('upgrades http image URLs to https at the API boundary', async () => {
    mockedApiClient.mockResolvedValue([
      {
        id: 'APL-IP15',
        brand: 'Apple',
        name: 'iPhone 15',
        basePrice: 899,
        imageUrl: 'http://example.com/iphone-15.webp',
      },
    ]);

    const products = await getProducts();

    expect(products[0]).toEqual(
      expect.objectContaining({
        imageUrl: 'https://example.com/iphone-15.webp',
      }),
    );
  });

  it('rejects malformed product payloads', async () => {
    mockedApiClient.mockResolvedValue([{ id: 'APL-IP15' }]);

    await expect(getProducts()).rejects.toThrow('Invalid product API response');
  });
});
