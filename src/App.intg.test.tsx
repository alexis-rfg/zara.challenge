import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { App } from './App';
import type * as ReactRouterDom from 'react-router-dom';

// Mock heavy page components to keep the integration test focused on routing
vi.mock('@/pages/PhoneListPage/PhoneListPage', () => ({
  PhoneListPage: () => <div data-testid="phone-list-page">PhoneListPage</div>,
}));
vi.mock('@/pages/PhoneDetailPage/PhoneDetailPage', () => ({
  PhoneDetailPage: () => <div data-testid="phone-detail-page">PhoneDetailPage</div>,
}));
vi.mock('@/pages/CartPage/CartPage', () => ({
  CartPage: () => <div data-testid="cart-page">CartPage</div>,
}));
vi.mock('@/pages/NotFoundPage/NotFoundPage', () => ({
  NotFoundPage: () => <div data-testid="not-found-page">NotFoundPage</div>,
}));
vi.mock('@/utils/localStorage', () => ({
  getCart: vi.fn(() => []),
  saveCart: vi.fn(),
  clearCart: vi.fn(),
}));

// Override BrowserRouter to use a memory location for tests
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof ReactRouterDom>();
  return { ...actual, BrowserRouter: actual.MemoryRouter };
});

describe('App routing', () => {
  it('renders PhoneListPage at /', () => {
    render(<App />);
    expect(screen.getByTestId('phone-list-page')).toBeInTheDocument();
  });
});
