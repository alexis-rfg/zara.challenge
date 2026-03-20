import type { CartItem } from '@/types/cart.types';
import { createLogger } from './logger';

const CART_KEY = 'zara-cart';
const storageLogger = createLogger({
  scope: 'storage.cart',
  tags: ['storage', 'cart'],
  context: {
    storageKey: CART_KEY,
  },
});

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
    if (!stored) {
      storageLogger.debug('read_empty', {
        tags: ['load'],
      });
      return [];
    }

    const items = JSON.parse(stored) as CartItem[];

    storageLogger.debug('read_success', {
      tags: ['load'],
      context: {
        itemCount: items.length,
      },
    });

    return items;
  } catch (error) {
    storageLogger.error('read_failed', {
      tags: ['load', 'error'],
      error,
    });
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
    storageLogger.debug('write_success', {
      tags: ['save'],
      context: {
        itemCount: items.length,
      },
    });
  } catch (error) {
    storageLogger.error('write_failed', {
      tags: ['save', 'error'],
      context: {
        itemCount: items.length,
      },
      error,
    });
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
    storageLogger.info('clear_success', {
      tags: ['clear'],
    });
  } catch (error) {
    storageLogger.error('clear_failed', {
      tags: ['clear', 'error'],
      error,
    });
  }
};
