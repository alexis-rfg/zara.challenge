import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
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

describe('PhoneListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page title', () => {
    vi.spyOn(useProductsHook, 'useProducts').mockReturnValue({
      products: [],
      loading: false,
      error: null,
      searchTerm: '',
      setSearchTerm: vi.fn(),
      resultCount: 0,
    });

    renderWithRouter(<PhoneListPage />);

    expect(screen.getByRole('heading', { name: 'Mobile Phones' })).toBeInTheDocument();
  });

  it('renders search bar', () => {
    vi.spyOn(useProductsHook, 'useProducts').mockReturnValue({
      products: [],
      loading: false,
      error: null,
      searchTerm: '',
      setSearchTerm: vi.fn(),
      resultCount: 0,
    });

    renderWithRouter(<PhoneListPage />);

    expect(screen.getByPlaceholderText('Search for a smartphone...')).toBeInTheDocument();
  });

  it('displays loading state', () => {
    vi.spyOn(useProductsHook, 'useProducts').mockReturnValue({
      products: [],
      loading: true,
      error: null,
      searchTerm: '',
      setSearchTerm: vi.fn(),
      resultCount: 0,
    });

    renderWithRouter(<PhoneListPage />);

    expect(screen.getByText('Loading products...')).toBeInTheDocument();
  });

  it('displays products in grid', () => {
    vi.spyOn(useProductsHook, 'useProducts').mockReturnValue({
      products: mockProducts,
      loading: false,
      error: null,
      searchTerm: '',
      setSearchTerm: vi.fn(),
      resultCount: 2,
    });

    renderWithRouter(<PhoneListPage />);

    expect(screen.getByText('Samsung')).toBeInTheDocument();
    expect(screen.getByText('Galaxy S24 Ultra')).toBeInTheDocument();
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument();
  });

  it('displays empty state when no products found', () => {
    vi.spyOn(useProductsHook, 'useProducts').mockReturnValue({
      products: [],
      loading: false,
      error: null,
      searchTerm: '',
      setSearchTerm: vi.fn(),
      resultCount: 0,
    });

    renderWithRouter(<PhoneListPage />);

    expect(screen.getByText('No products found')).toBeInTheDocument();
  });

  it('displays empty state with search term when no results', () => {
    vi.spyOn(useProductsHook, 'useProducts').mockReturnValue({
      products: [],
      loading: false,
      error: null,
      searchTerm: 'Nokia',
      setSearchTerm: vi.fn(),
      resultCount: 0,
    });

    renderWithRouter(<PhoneListPage />);

    expect(screen.getByText(/No products found for "Nokia"/)).toBeInTheDocument();
  });

  it('displays error state', () => {
    vi.spyOn(useProductsHook, 'useProducts').mockReturnValue({
      products: [],
      loading: false,
      error: 'Failed to load products. Please try again.',
      searchTerm: '',
      setSearchTerm: vi.fn(),
      resultCount: 0,
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
      products: [],
      loading: false,
      error: 'Network error',
      searchTerm: '',
      setSearchTerm: vi.fn(),
      resultCount: 0,
    });

    renderWithRouter(<PhoneListPage />);

    const retryButton = screen.getByRole('button', { name: 'Try Again' });
    expect(retryButton).toBeInTheDocument();
  });

  it('calls setSearchTerm when user types in search bar', async () => {
    const user = userEvent.setup();
    const setSearchTerm = vi.fn();

    vi.spyOn(useProductsHook, 'useProducts').mockReturnValue({
      products: mockProducts,
      loading: false,
      error: null,
      searchTerm: '',
      setSearchTerm,
      resultCount: 2,
    });

    renderWithRouter(<PhoneListPage />);

    const searchInput = screen.getByPlaceholderText('Search for a smartphone...');
    await user.type(searchInput, 'iPhone');

    await waitFor(() => {
      expect(setSearchTerm).toHaveBeenCalled();
    });
  });

  it('displays correct result count in search bar', () => {
    vi.spyOn(useProductsHook, 'useProducts').mockReturnValue({
      products: mockProducts,
      loading: false,
      error: null,
      searchTerm: '',
      setSearchTerm: vi.fn(),
      resultCount: 2,
    });

    renderWithRouter(<PhoneListPage />);

    expect(screen.getByText('2 results')).toBeInTheDocument();
  });

  it('sets document title on mount', () => {
    vi.spyOn(useProductsHook, 'useProducts').mockReturnValue({
      products: [],
      loading: false,
      error: null,
      searchTerm: '',
      setSearchTerm: vi.fn(),
      resultCount: 0,
    });

    renderWithRouter(<PhoneListPage />);

    expect(document.title).toBe('Zara Mobile Phones');
  });

  it('renders product cards as links', () => {
    vi.spyOn(useProductsHook, 'useProducts').mockReturnValue({
      products: mockProducts,
      loading: false,
      error: null,
      searchTerm: '',
      setSearchTerm: vi.fn(),
      resultCount: 2,
    });

    renderWithRouter(<PhoneListPage />);

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute('href', '/products/phone-1');
    expect(links[1]).toHaveAttribute('href', '/products/phone-2');
  });

  it('loading state has proper accessibility attributes', () => {
    vi.spyOn(useProductsHook, 'useProducts').mockReturnValue({
      products: [],
      loading: true,
      error: null,
      searchTerm: '',
      setSearchTerm: vi.fn(),
      resultCount: 0,
    });

    renderWithRouter(<PhoneListPage />);

    const loadingRegion = screen.getByText('Loading products...').parentElement;
    expect(loadingRegion).toHaveAttribute('aria-live', 'polite');
  });

  it('empty state has proper accessibility attributes', () => {
    vi.spyOn(useProductsHook, 'useProducts').mockReturnValue({
      products: [],
      loading: false,
      error: null,
      searchTerm: '',
      setSearchTerm: vi.fn(),
      resultCount: 0,
    });

    renderWithRouter(<PhoneListPage />);

    const emptyState = screen.getByText('No products found').parentElement;
    expect(emptyState).toHaveAttribute('role', 'status');
  });
});
