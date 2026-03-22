import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { CartProvider } from '../CartContext';
import { useCart } from '@/hooks/useCart';
import type { CartItem } from '@/types/cart.types';
import * as localStorageUtils from '@/utils/localStorage';
import cartItemFixtures from '@/test/fixtures/cartItems.json';

// Mock localStorage utilities
vi.mock('@/utils/localStorage', () => ({
  getCart: vi.fn(() => []),
  saveCart: vi.fn(),
  clearCart: vi.fn(),
}));

describe('CartContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset getCart to return empty array by default
    vi.mocked(localStorageUtils.getCart).mockReturnValue([]);
  });

  describe('CartProvider', () => {
    it('should provide cart context to children', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      expect(result.current).toBeDefined();
      expect(result.current.items).toEqual([]);
      expect(result.current.totalItems).toBe(0);
      expect(result.current.totalPrice).toBe(0);
    });

    it('should load cart from localStorage on mount', () => {
      const mockCart: CartItem[] = [cartItemFixtures.iphone15Blue128];

      vi.mocked(localStorageUtils.getCart).mockReturnValue(mockCart);

      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      expect(localStorageUtils.getCart).toHaveBeenCalledTimes(1);
      expect(result.current.items).toEqual(mockCart);
      expect(result.current.totalItems).toBe(1);
      expect(result.current.totalPrice).toBe(799);
    });

    it('should add item to cart', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      const newItem: CartItem = cartItemFixtures.iphone15Blue128;

      act(() => {
        result.current.addItem(newItem);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0]).toEqual(newItem);
      expect(result.current.totalItems).toBe(1);
      expect(result.current.totalPrice).toBe(799);
      expect(localStorageUtils.saveCart).toHaveBeenCalledWith([newItem]);
    });

    it('should remove item from cart', () => {
      const mockCart: CartItem[] = [cartItemFixtures.iphone15Blue128];

      vi.mocked(localStorageUtils.getCart).mockReturnValue(mockCart);

      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      act(() => {
        result.current.removeItem('iphone-15', 'Blue', '128GB');
      });

      expect(result.current.items).toHaveLength(0);
      expect(result.current.totalItems).toBe(0);
      expect(result.current.totalPrice).toBe(0);
      expect(localStorageUtils.saveCart).toHaveBeenCalledWith([]);
    });

    it('should not remove item if not found', () => {
      const mockCart: CartItem[] = [cartItemFixtures.iphone15Blue128];

      vi.mocked(localStorageUtils.getCart).mockReturnValue(mockCart);

      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      act(() => {
        result.current.removeItem('iphone-15', 'Red', '256GB');
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.totalItems).toBe(1);
    });

    it('should clear cart', () => {
      const mockCart: CartItem[] = [cartItemFixtures.iphone15Blue128];

      vi.mocked(localStorageUtils.getCart).mockReturnValue(mockCart);

      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      act(() => {
        result.current.clearCart();
      });

      expect(result.current.items).toHaveLength(0);
      expect(result.current.totalItems).toBe(0);
      expect(result.current.totalPrice).toBe(0);
      expect(localStorageUtils.saveCart).toHaveBeenCalledWith([]);
    });

    it('should calculate total price correctly with multiple items', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      const item1: CartItem = cartItemFixtures.iphone15Blue128;
      const item2: CartItem = cartItemFixtures.iphone15ProBlack256;

      act(() => {
        result.current.addItem(item1);
        result.current.addItem(item2);
      });

      expect(result.current.totalItems).toBe(2);
      expect(result.current.totalPrice).toBe(1798);
    });

    it('should save to localStorage whenever items change', () => {
      const { result } = renderHook(() => useCart(), {
        wrapper: CartProvider,
      });

      const newItem: CartItem = cartItemFixtures.iphone15Blue128;

      act(() => {
        result.current.addItem(newItem);
      });

      // Should be called after ADD_ITEM (hydration uses lazy initializer, not effect)
      expect(localStorageUtils.saveCart).toHaveBeenCalled();
      expect(localStorageUtils.saveCart).toHaveBeenCalledWith([newItem]);
    });
  });
});
