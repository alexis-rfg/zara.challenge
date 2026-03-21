import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { PhoneListPage } from './PhoneListPage';
import * as useProductsHook from '@/hooks/useProducts';
import type { ProductSummary } from '@/types/product.types';

const mockProducts: ProductSummary[] = [
  {
    id: 'phone-1',
    brand: 'Samsung',
    name: 'Galaxy S24 Ultra',
    basePrice: 1329,
    imageUrl: 'https://example.com/phone1.webp',
  },
  {
    id: 'phone-2',
    brand: 'Apple',
    name: 'iPhone 15 Pro',
    basePrice: 1199,
    imageUrl: 'https://example.com/phone2.webp',
  },
];

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

const mockHookBase = {
  products: [],
  loading: false,
  error: null,
  committedSearch: '',
  submitSearch: vi.fn(),
  resultCount: 0,
};

describe('PhoneListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page title', () => {
    vi.spyOn(useProductsHook, 'useProducts').mockReturnValue(mockHookBase);

    renderWithRouter(<PhoneListPage />);

    expect(screen.getByRole('heading', { name: 'Mobile Phones' })).toBeInTheDocument();
  });

  it('renders search bar', () => {
    vi.spyOn(useProductsHook, 'useProducts').mockReturnValue(mockHookBase);

    renderWithRouter(<PhoneListPage />);

    expect(screen.getByPlaceholderText('Search for a smartphone...')).toBeInTheDocument();
  });

  it('displays loading state', () => {
    vi.spyOn(useProductsHook, 'useProducts').mockReturnValue({ ...mockHookBase, loading: true });

    renderWithRouter(<PhoneListPage />);

    expect(screen.getByText('Loading products...')).toBeInTheDocument();
  });

  it('displays products in grid', () => {
    vi.spyOn(useProductsHook, 'useProducts').mockReturnValue({
      ...mockHookBase,
      products: mockProducts,
      resultCount: 2,
    });

    renderWithRouter(<PhoneListPage />);

    expect(screen.getByText('Samsung')).toBeInTheDocument();
    expect(screen.getByText('Galaxy S24 Ultra')).toBeInTheDocument();
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
  });

  it('displays empty state when no products found', () => {
    vi.spyOn(useProductsHook, 'useProducts').mockReturnValue(mockHookBase);

    renderWithRouter(<PhoneListPage />);

    expect(screen.getByText('No products found')).toBeInTheDocument();
  });

  it('displays empty state with committed search term when no results', () => {
    vi.spyOn(useProductsHook, 'useProducts').mockReturnValue({
      ...mockHookBase,
      committedSearch: 'Nokia',
    });

    renderWithRouter(<PhoneListPage />);

    expect(screen.getByText(/No products found for "Nokia"/)).toBeInTheDocument();
  });

  it('displays error state', () => {
    vi.spyOn(useProductsHook, 'useProducts').mockReturnValue({
      ...mockHookBase,
      error: 'Failed to load products. Please try again.',
    });

    renderWithRouter(<PhoneListPage />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Error Loading Products')).toBeInTheDocument();
    expect(screen.getByText('Failed to load products. Please try again.')).toBeInTheDocument();
  });

  it('error state has retry button', () => {
    const reloadSpy = vi.fn();
    Object.defineProperty(globalThis, 'location', {
      value: { reload: reloadSpy },
      writable: true,
    });

    vi.spyOn(useProductsHook, 'useProducts').mockReturnValue({
      ...mockHookBase,
      error: 'Network error',
    });

    renderWithRouter(<PhoneListPage />);

    expect(screen.getByRole('button', { name: 'Try Again' })).toBeInTheDocument();
  });

  it('calls submitSearch when user types and presses Enter', async () => {
    const user = userEvent.setup();
    const submitSearch = vi.fn();

    vi.spyOn(useProductsHook, 'useProducts').mockReturnValue({
      ...mockHookBase,
      products: mockProducts,
      resultCount: 2,
      submitSearch,
    });

    renderWithRouter(<PhoneListPage />);

    const searchInput = screen.getByPlaceholderText('Search for a smartphone...');
    await user.type(searchInput, 'iPhone');
    await user.keyboard('{Enter}');

    expect(submitSearch).toHaveBeenCalledWith('iPhone');
  });

  it('does not call submitSearch while the user is only typing', async () => {
    const user = userEvent.setup();
    const submitSearch = vi.fn();

    vi.spyOn(useProductsHook, 'useProducts').mockReturnValue({
      ...mockHookBase,
      products: mockProducts,
      resultCount: 2,
      submitSearch,
    });

    renderWithRouter(<PhoneListPage />);

    await user.type(screen.getByPlaceholderText('Search for a smartphone...'), 'iPhone');

    expect(submitSearch).not.toHaveBeenCalled();
  });

  it('displays correct result count in search bar', () => {
    vi.spyOn(useProductsHook, 'useProducts').mockReturnValue({
      ...mockHookBase,
      products: mockProducts,
      resultCount: 2,
    });

    renderWithRouter(<PhoneListPage />);

    expect(screen.getByText('2 results')).toBeInTheDocument();
  });

  it('sets document title on mount', () => {
    vi.spyOn(useProductsHook, 'useProducts').mockReturnValue(mockHookBase);

    renderWithRouter(<PhoneListPage />);

    expect(document.title).toBe('Zara Mobile Phones');
  });

  it('renders product cards as links', () => {
    vi.spyOn(useProductsHook, 'useProducts').mockReturnValue({
      ...mockHookBase,
      products: mockProducts,
      resultCount: 2,
    });

    renderWithRouter(<PhoneListPage />);

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', '/products/phone-1');
    expect(links[1]).toHaveAttribute('href', '/products/phone-2');
  });

  it('loading state has proper accessibility attributes', () => {
    vi.spyOn(useProductsHook, 'useProducts').mockReturnValue({ ...mockHookBase, loading: true });

    renderWithRouter(<PhoneListPage />);

    const loadingRegion = screen.getByText('Loading products...').parentElement;
    expect(loadingRegion).toHaveAttribute('aria-live', 'polite');
  });

  it('empty state has proper accessibility attributes', () => {
    vi.spyOn(useProductsHook, 'useProducts').mockReturnValue(mockHookBase);

    renderWithRouter(<PhoneListPage />);

    const emptyState = screen.getByText('No products found').parentElement;
    expect(emptyState).toHaveAttribute('role', 'status');
  });
});
