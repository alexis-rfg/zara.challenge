import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Navbar } from './Navbar';
import * as useCartHook from '@/hooks/useCart';

// Mock the useCart hook
vi.mock('@/hooks/useCart');

const renderNavbar = () => {
  return render(
    <BrowserRouter>
      <Navbar />
    </BrowserRouter>,
  );
};

describe('Navbar - Unit Tests', () => {
  it('should render home and cart links', () => {
    vi.spyOn(useCartHook, 'useCart').mockReturnValue({
      items: [],
      addItem: vi.fn(),
      removeItem: vi.fn(),
      clearCart: vi.fn(),
      totalItems: 0,
      totalPrice: 0,
    });

    renderNavbar();

    expect(screen.getByLabelText('Go to home page')).toBeInTheDocument();
    expect(screen.getByLabelText('Shopping cart with 0 items')).toBeInTheDocument();
  });

  it('should display cart count badge when items exist', () => {
    vi.spyOn(useCartHook, 'useCart').mockReturnValue({
      items: [],
      addItem: vi.fn(),
      removeItem: vi.fn(),
      clearCart: vi.fn(),
      totalItems: 3,
      totalPrice: 0,
    });

    renderNavbar();

    const badge = screen.getByLabelText('3 items in cart');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('3');
  });

  it('should not display cart count badge when cart is empty', () => {
    vi.spyOn(useCartHook, 'useCart').mockReturnValue({
      items: [],
      addItem: vi.fn(),
      removeItem: vi.fn(),
      clearCart: vi.fn(),
      totalItems: 0,
      totalPrice: 0,
    });

    renderNavbar();

    expect(screen.queryByLabelText(/items in cart/)).not.toBeInTheDocument();
  });

  it('should have correct navigation links', () => {
    vi.spyOn(useCartHook, 'useCart').mockReturnValue({
      items: [],
      addItem: vi.fn(),
      removeItem: vi.fn(),
      clearCart: vi.fn(),
      totalItems: 0,
      totalPrice: 0,
    });

    renderNavbar();

    const homeLink = screen.getByLabelText('Go to home page');
    const cartLink = screen.getByLabelText('Shopping cart with 0 items');

    expect(homeLink).toHaveAttribute('href', '/');
    expect(cartLink).toHaveAttribute('href', '/cart');
  });
});
