import type { CartItem, CartState, CartAction, CartContextType } from '@/types/cart.types';
import { CartActionType } from '@/types/cart.types';
import { useEffect, useReducer, useMemo, useCallback } from 'react';
import { getCart, saveCart } from '@/utils/localStorage';
import { createLogger } from '@/utils/logger';
import { CartContext } from './createCartContext';

const cartLogger = createLogger({
  scope: 'cart.context',
  tags: ['cart', 'state'],
});

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case CartActionType.ADD_ITEM:
      return {
        ...state,
        items: [...state.items, action.payload],
      };
    case CartActionType.REMOVE_ITEM: {
      const itemIndex = state.items.findIndex((item) => {
        return (
          item.id === action.payload.id &&
          item.colorName === action.payload.colorName &&
          item.storageCapacity === action.payload.storageCapacity
        );
      });
      if (itemIndex === -1) {
        return state;
      }
      const newItems = [...state.items];
      newItems.splice(itemIndex, 1);

      return {
        ...state,
        items: newItems,
      };
    }

    case CartActionType.CLEAR_CART:
      return { ...state, items: [] };

    case CartActionType.LOAD_CART:
      return { ...state, items: action.payload };

    default:
      return state;
  }
};

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart: CartItem[] = getCart();
    cartLogger.info('hydrate', {
      tags: ['load'],
      context: {
        itemCount: savedCart.length,
      },
    });
    dispatch({ type: CartActionType.LOAD_CART, payload: savedCart });
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    saveCart(state.items);
    cartLogger.debug('persist', {
      tags: ['save'],
      context: {
        itemCount: state.items.length,
      },
    });
  }, [state.items]);

  // Cart methods
  const addItem = useCallback((item: CartItem) => {
    cartLogger.info('add_item', {
      tags: ['mutation'],
      context: {
        productId: item.id,
        colorName: item.colorName,
        storageCapacity: item.storageCapacity,
        price: item.price,
      },
    });
    dispatch({ type: CartActionType.ADD_ITEM, payload: item });
  }, []);

  const removeItem = useCallback((id: string, colorName: string, storageCapacity: string) => {
    cartLogger.info('remove_item', {
      tags: ['mutation'],
      context: {
        productId: id,
        colorName,
        storageCapacity,
      },
    });
    dispatch({
      type: CartActionType.REMOVE_ITEM,
      payload: { id, colorName, storageCapacity },
    });
  }, []);

  const clearCart = useCallback(() => {
    cartLogger.warn('clear_cart', {
      tags: ['mutation'],
      context: {
        itemCount: state.items.length,
      },
    });
    dispatch({ type: CartActionType.CLEAR_CART });
  }, [state.items.length]);

  // Computed values
  const totalItems = state.items.length;
  const totalPrice = state.items.reduce((sum, item) => sum + item.price, 0);

  const value: CartContextType = useMemo(
    () => ({
      items: state.items,
      addItem,
      removeItem,
      clearCart,
      totalItems,
      totalPrice,
    }),
    [addItem, clearCart, removeItem, state.items, totalItems, totalPrice],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
