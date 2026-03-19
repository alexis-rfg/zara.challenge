import { createContext } from 'react';
import type { CartContextType } from '@/types/cart.types';

/**
 * Cart Context instance.
 *
 * This is in a separate file to satisfy React Fast Refresh requirements.
 * Fast Refresh only works when a file exports ONLY components.
 * Since CartContext.tsx exports the CartProvider component, the context
 * instance must be in its own file to avoid breaking Fast Refresh.
 *
 * @see {@link https://github.com/vitejs/vite-plugin-react/tree/main/packages/plugin-react#consistent-components-exports}
 */
export const CartContext = createContext<CartContextType | undefined>(undefined);
