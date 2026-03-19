import type { CartItem, CartState, CartAction, CartContextType } from '@/types/cart.types';
import { CartActionType } from '@/types/cart.types';
import { useEffect, useReducer, useMemo } from 'react';
import { getCart, saveCart } from '@/utils/localStorage';
import { CartContext } from './createCartContext';

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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const savedCart: CartItem[] = getCart();
    dispatch({ type: CartActionType.LOAD_CART, payload: savedCart });
  }, []);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    saveCart(state.items);
  }, [state.items]);

  // Cart methods
  const addItem = (item: CartItem) => {
    dispatch({ type: CartActionType.ADD_ITEM, payload: item });
  };

  const removeItem = (id: string, colorName: string, storageCapacity: string) => {
    dispatch({
      type: CartActionType.REMOVE_ITEM,
      payload: { id, colorName, storageCapacity },
    });
  };

  const clearCart = () => {
    dispatch({ type: CartActionType.CLEAR_CART });
  };

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
    [state.items, totalItems, totalPrice],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
