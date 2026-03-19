import { useContext } from 'react';
import { CartContext } from '@/context/createCartContext';
import type { CartContextType } from '@/types/cart.types';

/**
 * Custom hook to access the shopping cart context.
 * Must be used within a CartProvider.
 *
 * @returns Cart context with items, methods, and computed values
 * @throws Error if used outside of CartProvider
 *
 * @example
 * ```typescript
 * const { items, addItem, removeItem, totalItems, totalPrice } = useCart();
 * ```
 */
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
