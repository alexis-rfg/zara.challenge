import type { CartItem } from '@/types/cart.types';
import { createLogger } from './logger';
import { toSecureAssetUrl } from './urlSecurity';

const CART_KEY = 'zara-cart';
const storageLogger = createLogger({
  scope: 'storage.cart',
  tags: ['storage', 'cart'],
  context: {
    storageKey: CART_KEY,
  },
});

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null;
};

const normalizeCartItem = (value: unknown): CartItem => {
  if (!isRecord(value)) {
    throw new Error('Cart item must be an object');
  }

  const { id, name, brand, imageUrl, colorName, storageCapacity, price } = value;

  if (typeof id !== 'string' || id.trim() === '') {
    throw new Error('Cart item id must be a non-empty string');
  }

  if (typeof name !== 'string' || name.trim() === '') {
    throw new Error('Cart item name must be a non-empty string');
  }

  if (typeof brand !== 'string' || brand.trim() === '') {
    throw new Error('Cart item brand must be a non-empty string');
  }

  if (typeof imageUrl !== 'string') {
    throw new Error('Cart item imageUrl must be a string');
  }

  if (typeof colorName !== 'string' || colorName.trim() === '') {
    throw new Error('Cart item colorName must be a non-empty string');
  }

  if (typeof storageCapacity !== 'string' || storageCapacity.trim() === '') {
    throw new Error('Cart item storageCapacity must be a non-empty string');
  }

  if (typeof price !== 'number' || !Number.isFinite(price)) {
    throw new Error('Cart item price must be a finite number');
  }

  return {
    id: id.trim(),
    name: name.trim(),
    brand: brand.trim(),
    imageUrl: toSecureAssetUrl(imageUrl),
    colorName: colorName.trim(),
    storageCapacity: storageCapacity.trim(),
    price,
  };
};

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

    const parsed = JSON.parse(stored) as unknown;
    if (!Array.isArray(parsed)) {
      throw new Error('Stored cart payload must be an array');
    }

    const items = parsed.flatMap((value) => {
      try {
        return [normalizeCartItem(value)];
      } catch (error) {
        storageLogger.warn('read_invalid_item', {
          tags: ['load', 'validation'],
          error,
        });
        return [];
      }
    });

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
    const sanitizedItems = items.map((item) => normalizeCartItem(item));
    localStorage.setItem(CART_KEY, JSON.stringify(sanitizedItems));
    storageLogger.debug('write_success', {
      tags: ['save'],
      context: {
        itemCount: sanitizedItems.length,
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
