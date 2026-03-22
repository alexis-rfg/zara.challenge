import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getCart, saveCart, clearCart } from '../localStorage';
import { clearLogEntries, getLogEntries } from '../logger';
import type { CartItem } from '@/types/cart.types';

describe('localStorage utilities - Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    clearLogEntries();
  });

  describe('getCart', () => {
    it('should return empty array when localStorage is empty', () => {
      const result = getCart();
      expect(result).toEqual([]);
    });

    it('should return parsed cart items from localStorage', () => {
      const mockItems: CartItem[] = [
        {
          id: '1',
          name: 'iPhone 15',
          brand: 'Apple',
          imageUrl: 'http://example.com/test.jpg',
          colorName: 'Black',
          storageCapacity: '128GB',
          price: 999,
        },
      ];

      localStorage.setItem('zara-cart', JSON.stringify(mockItems));

      const result = getCart();
      expect(result).toEqual([
        {
          ...mockItems[0],
          imageUrl: 'https://example.com/test.jpg',
        },
      ]);
    });

    it('should return empty array when localStorage data is corrupted', () => {
      localStorage.setItem('zara-cart', 'invalid-json');

      const result = getCart();

      expect(result).toEqual([]);
      expect(getLogEntries()).toContainEqual(
        expect.objectContaining({
          scope: 'storage.cart',
          event: 'read_failed',
          tags: ['storage', 'cart', 'load', 'error'],
        }),
      );
    });
  });

  describe('saveCart', () => {
    it('should save cart items to localStorage', () => {
      const mockItems: CartItem[] = [
        {
          id: '1',
          name: 'iPhone 15',
          brand: 'Apple',
          imageUrl: 'http://example.com/test.jpg',
          colorName: 'Black',
          storageCapacity: '128GB',
          price: 999,
        },
      ];

      saveCart(mockItems);

      const stored = localStorage.getItem('zara-cart');
      expect(stored).toBe(
        JSON.stringify([
          {
            ...mockItems[0],
            imageUrl: 'https://example.com/test.jpg',
          },
        ]),
      );
    });

    it('should handle errors when saving fails', () => {
      const mockItems: CartItem[] = [];

      // Mock localStorage.setItem to throw
      vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
        throw new Error('Storage quota exceeded');
      });

      saveCart(mockItems);

      expect(getLogEntries()).toContainEqual(
        expect.objectContaining({
          scope: 'storage.cart',
          event: 'write_failed',
          tags: ['storage', 'cart', 'save', 'error'],
        }),
      );
    });

    it('should discard invalid cart items with unsafe image URLs', () => {
      localStorage.setItem(
        'zara-cart',
        JSON.stringify([
          {
            id: '1',
            name: 'iPhone 15',
            brand: 'Apple',
            imageUrl: 'javascript:alert(1)',
            colorName: 'Black',
            storageCapacity: '128GB',
            price: 999,
          },
        ]),
      );

      const result = getCart();

      expect(result).toEqual([]);
      expect(getLogEntries()).toContainEqual(
        expect.objectContaining({
          scope: 'storage.cart',
          event: 'read_invalid_item',
          tags: ['storage', 'cart', 'load', 'validation'],
        }),
      );
    });
  });

  describe('clearCart', () => {
    it('should remove cart from localStorage', () => {
      localStorage.setItem('zara-cart', JSON.stringify([{ id: '1' }]));

      clearCart();

      expect(localStorage.getItem('zara-cart')).toBeNull();
    });

    it('should handle errors when clearing fails', () => {
      // Mock localStorage.removeItem to throw
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      clearCart();

      expect(getLogEntries()).toContainEqual(
        expect.objectContaining({
          scope: 'storage.cart',
          event: 'clear_failed',
          tags: ['storage', 'cart', 'clear', 'error'],
        }),
      );
    });
  });
});
