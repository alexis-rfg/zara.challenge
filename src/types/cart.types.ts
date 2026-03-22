import type { ReactNode } from 'react';

/**
 * Represents an item in the shopping cart
 */
export type CartItem = {
  id: string;
  name: string;
  brand: string;
  imageUrl: string;
  colorName: string;
  storageCapacity: string;
  price: number;
};

/**
 * Enum for cart action types to ensure type safety
 */
export enum CartActionType {
  ADD_ITEM = 'ADD_ITEM',
  REMOVE_ITEM = 'REMOVE_ITEM',
  CLEAR_CART = 'CLEAR_CART',
  LOAD_CART = 'LOAD_CART',
}

/**
 * Cart state structure
 */
export type CartState = {
  items: CartItem[];
};

/**
 * Payload for removing an item from cart
 */
export type RemoveItemPayload = {
  id: string;
  colorName: string;
  storageCapacity: string;
};

/**
 * Union type for all possible cart actions
 */
export type CartAction =
  | { type: CartActionType.ADD_ITEM; payload: CartItem }
  | { type: CartActionType.REMOVE_ITEM; payload: RemoveItemPayload }
  | { type: CartActionType.CLEAR_CART }
  | { type: CartActionType.LOAD_CART; payload: CartItem[] };

/**
 * Cart context type definition
 */
export type CartContextType = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string, colorName: string, storageCapacity: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
};

/** Props accepted by the cart context provider. */
export type CartProviderProps = {
  /** Descendant nodes that consume cart state. */
  children: ReactNode;
};
