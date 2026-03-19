import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getCart, saveCart, clearCart } from './localStorage';
import type { CartItem } from '@/types/cart.types';

describe('localStorage utilities - Unit Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
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
          imageUrl: 'test.jpg',
          colorName: 'Black',
          storageCapacity: '128GB',
          price: 999,
        },
      ];

      localStorage.setItem('zara-cart', JSON.stringify(mockItems));

      const result = getCart();
      expect(result).toEqual(mockItems);
    });

    it('should return empty array when localStorage data is corrupted', () => {
      localStorage.setItem('zara-cart', 'invalid-json');

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const result = getCart();

      expect(result).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error parsing cart from localStorage:',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });

  describe('saveCart', () => {
    it('should save cart items to localStorage', () => {
      const mockItems: CartItem[] = [
        {
          id: '1',
          name: 'iPhone 15',
          brand: 'Apple',
          imageUrl: 'test.jpg',
          colorName: 'Black',
          storageCapacity: '128GB',
          price: 999,
        },
      ];

      saveCart(mockItems);

      const stored = localStorage.getItem('zara-cart');
      expect(stored).toBe(JSON.stringify(mockItems));
    });

    it('should handle errors when saving fails', () => {
      const mockItems: CartItem[] = [];
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock localStorage.setItem to throw
      vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
        throw new Error('Storage quota exceeded');
      });

      saveCart(mockItems);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error saving cart to localStorage:',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });

  describe('clearCart', () => {
    it('should remove cart from localStorage', () => {
      localStorage.setItem('zara-cart', JSON.stringify([{ id: '1' }]));

      clearCart();

      expect(localStorage.getItem('zara-cart')).toBeNull();
    });

    it('should handle errors when clearing fails', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Mock localStorage.removeItem to throw
      vi.spyOn(Storage.prototype, 'removeItem').mockImplementationOnce(() => {
        throw new Error('Storage error');
      });

      clearCart();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to clear cart from localStorage:',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });
});
