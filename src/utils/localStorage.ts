import type { CartItem } from '@/types/product.types';

const CART_KEY = 'zara-cart';

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

export const saveCart = (items: CartItem[]): void => {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch (error) {
    console.error('Error saving cart to localStorage:', error);
  }
};

export const clearCart = (): void => {
  try {
    localStorage.removeItem(CART_KEY);
  } catch (error) {
    console.error('Failed to clear cart from localStorage:', error);
  }
};
