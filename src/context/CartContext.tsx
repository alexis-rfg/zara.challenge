import type {
  CartAction,
  CartContextType,
  CartItem,
  CartProviderProps,
  CartState,
} from '@/types/cart.types';
import { CartActionType } from '@/types/cart.types';
import { useEffect, useReducer, useMemo, useCallback, useRef } from 'react';
import { getCart, saveCart } from '@/utils/localStorage';
import { createLogger } from '@/utils/logger';
import { CartContext } from './createCartContext';

const cartLogger = createLogger({
  scope: 'cart.context',
  tags: ['cart', 'state'],
});

/**
 * Pure reducer that computes the next cart state from the current state and a dispatched action.
 *
 * - `ADD_ITEM` — appends a new item. Duplicate combinations (same id + color + storage) are
 *   intentionally allowed; each is an independent line item.
 * - `REMOVE_ITEM` — removes the **first** matching item by `id + colorName + storageCapacity`.
 *   Uses `findIndex` so only one unit is removed per click even if the same config appears twice.
 * - `CLEAR_CART` — empties the cart entirely.
 * - `LOAD_CART` — replaces the full item list (used on initial hydration from localStorage).
 *
 * @param state - Current cart state.
 * @param action - Dispatched cart action.
 * @returns Next cart state (a new object reference on every mutation).
 */
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

/**
 * Provides cart state and actions to the component tree via {@link CartContext}.
 *
 * ### Responsibilities
 * - Hydrates cart from `localStorage` on mount.
 * - Persists cart to `localStorage` on every state change.
 * - Exposes stable `addItem`, `removeItem`, and `clearCart` callbacks (memoised
 *   with `useCallback`) to prevent unnecessary re-renders in consumers.
 * - Derives `totalItems` and `totalPrice` from the item list.
 *
 * @param children - React node(s) that will have access to the cart context.
 */
export const CartProvider = ({ children }: CartProviderProps) => {
  const [state, dispatch] = useReducer(cartReducer, undefined, () => {
    const savedCart = getCart();
    cartLogger.info('hydrate', {
      tags: ['load'],
      context: {
        itemCount: savedCart.length,
      },
    });
    return { items: savedCart };
  });

  // Guard: skip the very first save effect so we never overwrite
  // localStorage with stale state during React 19 StrictMode's
  // double-invocation of effects.
  const isHydrated = useRef(false);

  // Save cart to localStorage whenever items change
  useEffect(() => {
    if (!isHydrated.current) {
      isHydrated.current = true;
      return;
    }
    saveCart(state.items);
    cartLogger.debug('persist', {
      tags: ['save'],
      context: {
        itemCount: state.items.length,
      },
    });
  }, [state.items]);

  // Cart methods
  /**
   * Appends a fully configured product variant to the cart.
   *
   * @param item - Resolved cart line item to add.
   */
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

  /**
   * Removes the first matching configured variant from the cart.
   *
   * @param id - Product identifier.
   * @param colorName - Selected color name.
   * @param storageCapacity - Selected storage capacity.
   */
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

  /** Removes every line item from the cart. */
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
