import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from '@/context/CartContext';
import { Layout } from '@/components/Layout/Layout';
import { PhoneListPage } from '@/pages/PhoneListPage/PhoneListPage';
import { PhoneDetailPage } from '@/pages/PhoneDetailPage/PhoneDetailPage';
import { CartPage } from '@/pages/CartPage/CartPage';
import { NotFoundPage } from '@/pages/NotFoundPage/NotFoundPage';

/**
 * Application root component.
 *
 * Sets up the two top-level providers:
 * - {@link CartProvider} — makes cart state available to the entire tree via context.
 * - `<BrowserRouter>` — enables client-side routing with React Router v6.
 *
 * The `future` flags opt into React Router v7 behaviours that are back-ported
 * as opt-in flags in v6, suppressing console warnings about upcoming breaking
 * changes. Tests use `<MemoryRouter>` instead of this `<BrowserRouter>`, and
 * `src/test/setup.ts` suppresses the same warnings there.
 *
 * Route structure (all wrapped by {@link Layout}):
 * - `/`             → {@link PhoneListPage}
 * - `/products/:id` → {@link PhoneDetailPage}
 * - `/cart`         → {@link CartPage}
 * - `*`             → {@link NotFoundPage} (catch-all 404)
 */
export const App = () => {
  return (
    <CartProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<PhoneListPage />} />
            <Route path="products/:id" element={<PhoneDetailPage />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
};
