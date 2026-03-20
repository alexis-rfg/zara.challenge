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
  it('should render logo and cart link', () => {
    vi.spyOn(useCartHook, 'useCart').mockReturnValue({
      items: [],
      addItem: vi.fn(),
      removeItem: vi.fn(),
      clearCart: vi.fn(),
      totalItems: 0,
      totalPrice: 0,
    });

    renderNavbar();

    expect(screen.getByAltText('MBST')).toBeInTheDocument();
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

  it('should display cart count badge even when cart is empty', () => {
    vi.spyOn(useCartHook, 'useCart').mockReturnValue({
      items: [],
      addItem: vi.fn(),
      removeItem: vi.fn(),
      clearCart: vi.fn(),
      totalItems: 0,
      totalPrice: 0,
    });

    renderNavbar();

    expect(screen.getByLabelText('0 items in cart')).toBeInTheDocument();
    expect(screen.getByLabelText('0 items in cart')).toHaveTextContent('0');
  });

  it('should have correct cart navigation link', () => {
    vi.spyOn(useCartHook, 'useCart').mockReturnValue({
      items: [],
      addItem: vi.fn(),
      removeItem: vi.fn(),
      clearCart: vi.fn(),
      totalItems: 0,
      totalPrice: 0,
    });

    renderNavbar();

    const cartLink = screen.getByLabelText('Shopping cart with 0 items');
    expect(cartLink).toHaveAttribute('href', '/cart');
  });
});
