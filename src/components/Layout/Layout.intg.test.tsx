import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Layout } from './Layout';
import { CartProvider } from '@/context/CartContext';

// Mock localStorage utilities
vi.mock('@/utils/localStorage', () => ({
  getCart: vi.fn(() => []),
  saveCart: vi.fn(),
  clearCart: vi.fn(),
}));

const renderLayout = () => {
  return render(
    <BrowserRouter>
      <CartProvider>
        <Layout />
      </CartProvider>
    </BrowserRouter>,
  );
};

describe('Layout - Integration Tests', () => {
  it('should render navbar with cart context', () => {
    renderLayout();

    // Navbar should be present
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByLabelText('Shopping cart with 0 items')).toBeInTheDocument();
  });

  it('should render main content area with outlet', () => {
    renderLayout();

    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
  });

  it('should integrate navbar with cart provider', () => {
    renderLayout();

    // Cart count should be 0 initially (from CartProvider)
    expect(screen.getByLabelText('Shopping cart with 0 items')).toBeInTheDocument();
    expect(screen.getByLabelText('0 items in cart')).toBeInTheDocument();
  });
});
