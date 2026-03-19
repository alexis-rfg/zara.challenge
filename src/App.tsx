import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from '@/context/CartContext';
import { Layout } from '@/components/Layout/Layout';
import { PhoneListPage } from '@/pages/PhoneListPage/PhoneListPage';
import { PhoneDetailPage } from '@/pages/PhoneDetailPage/PhoneDetailPage';
import { CartPage } from '@/pages/CartPage/CartPage';
import { NotFoundPage } from '@/pages/NotFoundPage/NotFoundPage';

export const App = () => {
  return (
    <CartProvider>
      <BrowserRouter>
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
