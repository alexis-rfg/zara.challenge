import type { CartItem } from '@/types/product.types';

const CART_KEY = 'zara-cart';

/**
 * Retrieves the shopping cart from localStorage.
 *
 * @returns Array of cart items, or empty array if cart is empty or corrupted
 *
 * @example
 * ```typescript
 * const cartItems = getCart();
 * console.log(`Cart has ${cartItems.length} items`);
 * ```
 */
export const getCart = (): CartItem[] => {
  try {
    const stored = localStorage.getItem(CART_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as CartItem[];
  } catch (error) {
    console.error('Error parsing cart from localStorage:', error);
    return [];
  }
};

/**
 * Saves the shopping cart to localStorage.
 *
 * @param items - Array of cart items to save
 *
 * @example
 * ```typescript
 * const updatedCart = [...currentCart, newItem];
 * saveCart(updatedCart);
 * ```
 */
export const saveCart = (items: CartItem[]): void => {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Error saving cart to localStorage:', error);
  }
};

/**
 * Removes all items from the shopping cart in localStorage.
 *
 * @example
 * ```typescript
 * clearCart();
 * console.log('Cart cleared');
 * ```
 */
export const clearCart = (): void => {
  try {
    localStorage.removeItem(CART_KEY);
  } catch (error) {
    console.error('Failed to clear cart from localStorage:', error);
  }
};
