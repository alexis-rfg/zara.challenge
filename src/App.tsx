import { Suspense, lazy } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Layout } from '@/components/Layout/Layout';
import { CartProvider } from '@/context/CartContext';
import { PhoneListPage } from '@/pages/PhoneListPage/PhoneListPage';

const CartPage = lazy(async () =>
  import('@/pages/CartPage/CartPage').then((module) => ({ default: module.CartPage })),
);
const NotFoundPage = lazy(async () =>
  import('@/pages/NotFoundPage/NotFoundPage').then((module) => ({
    default: module.NotFoundPage,
  })),
);
const PhoneDetailPage = lazy(async () =>
  import('@/pages/PhoneDetailPage/PhoneDetailPage').then((module) => ({
    default: module.PhoneDetailPage,
  })),
);

const routeFallback = (
  <div role="status" aria-live="polite" aria-label="Loading page" className="sr-only">
    Loading page
  </div>
);

/**
 * Application root component.
 *
 * Sets up the two top-level providers:
 * - {@link CartProvider} makes cart state available to the entire tree via context.
 * - `<BrowserRouter>` enables client-side routing with React Router v6.
 *
 * The `future` flags opt into React Router v7 behaviors that are back-ported
 * as opt-in flags in v6, suppressing console warnings about upcoming breaking
 * changes. Tests use `<MemoryRouter>` instead of this `<BrowserRouter>`, and
 * `src/test/setup.ts` suppresses the same warnings there.
 *
 * Route structure (all wrapped by {@link Layout}):
 * - `/` -> {@link PhoneListPage}
 * - `/products/:id` -> {@link PhoneDetailPage}
 * - `/cart` -> {@link CartPage}
 * - `*` -> {@link NotFoundPage} (catch-all 404)
 *
 * In production, BrowserRouter also depends on a server-side SPA fallback.
 * Without a rewrite to `/index.html`, refreshing `/cart` or `/products/:id`
 * returns the host 404 page before React Router can resolve the route.
 */
export const App = () => {
  return (
    <CartProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<PhoneListPage />} />
            <Route
              path="products/:id"
              element={
                <Suspense fallback={routeFallback}>
                  <PhoneDetailPage />
                </Suspense>
              }
            />
            <Route
              path="cart"
              element={
                <Suspense fallback={routeFallback}>
                  <CartPage />
                </Suspense>
              }
            />
            <Route
              path="*"
              element={
                <Suspense fallback={routeFallback}>
                  <NotFoundPage />
                </Suspense>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </CartProvider>
  );
};
