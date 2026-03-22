import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { CartPage } from '../CartPage';
import * as useCartHook from '@/hooks/useCart';
import type { CartItem } from '@/types/cart.types';

vi.mock('@/hooks/useCart');

const renderCartPage = () =>
  render(
    <MemoryRouter>
      <CartPage />
    </MemoryRouter>,
  );

const mockCartItem: CartItem = {
  id: 'SMG-S24U',
  name: 'Galaxy S24 Ultra',
  brand: 'Samsung',
  imageUrl: 'http://example.com/phone.webp',
  colorName: 'Violet Titanium',
  storageCapacity: '512 GB',
  price: 1199,
};

describe('CartPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders only continue shopping action when the cart is empty', () => {
    vi.spyOn(useCartHook, 'useCart').mockReturnValue({
      items: [],
      addItem: vi.fn(),
      removeItem: vi.fn(),
      clearCart: vi.fn(),
      totalItems: 0,
      totalPrice: 0,
    });

    renderCartPage();

    expect(screen.getByRole('heading', { name: 'Cart (0)' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continuar comprando' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Proceder al pago' })).not.toBeInTheDocument();
    expect(screen.queryByText('Total')).not.toBeInTheDocument();
  });

  it('renders total summary and pay action when the cart has items', () => {
    vi.spyOn(useCartHook, 'useCart').mockReturnValue({
      items: [mockCartItem],
      addItem: vi.fn(),
      removeItem: vi.fn(),
      clearCart: vi.fn(),
      totalItems: 1,
      totalPrice: 1199,
    });

    renderCartPage();

    expect(screen.getByRole('heading', { name: 'Cart (1)' })).toBeInTheDocument();
    expect(screen.getByText('Galaxy S24 Ultra')).toBeInTheDocument();
    expect(screen.getByText('512 GB | Violet Titanium')).toBeInTheDocument();
    expect(screen.getByText('Total')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Proceder al pago' })).toBeInTheDocument();
  });

  it('removes an item when delete is clicked', async () => {
    const user = userEvent.setup();
    const removeItem = vi.fn();

    vi.spyOn(useCartHook, 'useCart').mockReturnValue({
      items: [mockCartItem],
      addItem: vi.fn(),
      removeItem,
      clearCart: vi.fn(),
      totalItems: 1,
      totalPrice: 1199,
    });

    renderCartPage();

    await user.click(screen.getByRole('button', { name: 'Eliminar Galaxy S24 Ultra del carrito' }));

    expect(removeItem).toHaveBeenCalledWith('SMG-S24U', 'Violet Titanium', '512 GB');
  });
});
