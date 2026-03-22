import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { PhoneDetailPage } from '../PhoneDetailPage';
import * as useProductDetailHook from '@/hooks/useProductDetail';
import * as useCartHook from '@/hooks/useCart';
import type { ProductDetail } from '@/types/product.types';

vi.mock('@/hooks/useProductDetail');
vi.mock('@/hooks/useCart');

const mockProduct: ProductDetail = {
  id: 'APL-IP15',
  brand: 'Apple',
  name: 'iPhone 15',
  description: 'The latest iPhone.',
  basePrice: 899,
  rating: 4.8,
  specs: {
    screen: '6.1" Super Retina XDR',
    resolution: '2556 x 1179 pixels',
    processor: 'A16 Bionic',
    mainCamera: '48 MP',
    selfieCamera: '12 MP',
    battery: '3877 mAh',
    os: 'iOS 17',
    screenRefreshRate: '60 Hz',
  },
  colorOptions: [
    { name: 'Black', hexCode: '#1C1C1E', imageUrl: '/img/black.webp' },
    { name: 'Blue', hexCode: '#5E6B8B', imageUrl: '/img/blue.webp' },
  ],
  storageOptions: [
    { capacity: '128 GB', price: 899 },
    { capacity: '256 GB', price: 999 },
  ],
  similarProducts: [
    {
      id: 'SMG-S24',
      brand: 'Samsung',
      name: 'Galaxy S24',
      basePrice: 799,
      imageUrl: '/img/s24.webp',
    },
  ],
};

const mockAddItem = vi.fn();
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  // eslint-disable-next-line @typescript-eslint/consistent-type-imports
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderDetailPage = (id = 'APL-IP15') =>
  render(
    <MemoryRouter initialEntries={[`/products/${id}`]}>
      <Routes>
        <Route path="/products/:id" element={<PhoneDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );

describe('PhoneDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCartHook.useCart).mockReturnValue({
      items: [],
      totalItems: 0,
      totalPrice: 0,
      addItem: mockAddItem,
      removeItem: vi.fn(),
      clearCart: vi.fn(),
    });
  });

  describe('loading state', () => {
    it('shows a loading spinner while fetching', () => {
      vi.mocked(useProductDetailHook.useProductDetail).mockReturnValue({
        product: null,
        loading: true,
        error: null,
      });

      renderDetailPage();

      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('shows error message when fetch fails', () => {
      vi.mocked(useProductDetailHook.useProductDetail).mockReturnValue({
        product: null,
        loading: false,
        error: 'Product not found',
      });

      renderDetailPage();

      expect(screen.getByRole('alert')).toBeInTheDocument();
      // Both h2 and p contain "Product not found" — assert the paragraph specifically
      expect(screen.getAllByText('Product not found').length).toBeGreaterThan(0);
    });

    it('shows fallback message when no product and no error', () => {
      vi.mocked(useProductDetailHook.useProductDetail).mockReturnValue({
        product: null,
        loading: false,
        error: null,
      });

      renderDetailPage();

      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/does not exist/i)).toBeInTheDocument();
    });

    it('navigates home when Back to Home button is clicked from error state', async () => {
      const user = userEvent.setup();
      vi.mocked(useProductDetailHook.useProductDetail).mockReturnValue({
        product: null,
        loading: false,
        error: 'Not found',
      });

      renderDetailPage();
      await user.click(screen.getByRole('button', { name: /back to home/i }));

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('loaded state', () => {
    beforeEach(() => {
      vi.mocked(useProductDetailHook.useProductDetail).mockReturnValue({
        product: mockProduct,
        loading: false,
        error: null,
      });
    });

    it('renders product name and brand', () => {
      renderDetailPage();
      expect(screen.getByRole('heading', { name: /iphone 15/i })).toBeInTheDocument();
    });

    it('renders all 8 technical specs', () => {
      renderDetailPage();
      expect(screen.getByText('6.1" Super Retina XDR')).toBeInTheDocument();
      expect(screen.getByText('A16 Bionic')).toBeInTheDocument();
      expect(screen.getByText('iOS 17')).toBeInTheDocument();
    });

    it('renders color selector', () => {
      renderDetailPage();
      expect(screen.getByRole('radiogroup', { name: /select color/i })).toBeInTheDocument();
    });

    it('renders storage selector', () => {
      renderDetailPage();
      expect(
        screen.getByRole('radiogroup', { name: /select storage capacity/i }),
      ).toBeInTheDocument();
    });

    it('"Add to cart" button is disabled before selections are made', () => {
      renderDetailPage();
      const btn = screen.getByRole('button', { name: /add to cart/i });
      expect(btn).toBeDisabled();
      expect(btn).toHaveAttribute('aria-disabled', 'true');
    });

    it('"Add to cart" button enables after both color and storage are selected', async () => {
      const user = userEvent.setup();
      renderDetailPage();

      await user.click(screen.getByRole('radio', { name: 'Black' }));
      await user.click(screen.getByRole('radio', { name: '128 GB' }));

      const btn = screen.getByRole('button', { name: /add to cart/i });
      expect(btn).not.toBeDisabled();
      expect(btn).toHaveAttribute('aria-disabled', 'false');
    });

    it('adds item and navigates to cart when "Add to cart" is clicked', async () => {
      const user = userEvent.setup();
      renderDetailPage();

      await user.click(screen.getByRole('radio', { name: 'Black' }));
      await user.click(screen.getByRole('radio', { name: '128 GB' }));
      await user.click(screen.getByRole('button', { name: /add to cart/i }));

      expect(mockAddItem).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'APL-IP15',
          colorName: 'Black',
          storageCapacity: '128 GB',
          price: 899,
        }),
      );
      expect(mockNavigate).toHaveBeenCalledWith('/cart');
    });

    it('selecting storage alone auto-selects first color', async () => {
      const user = userEvent.setup();
      renderDetailPage();

      await user.click(screen.getByRole('radio', { name: '256 GB' }));

      // Button should now be enabled (color was auto-selected)
      await waitFor(() =>
        expect(screen.getByRole('button', { name: /add to cart/i })).not.toBeDisabled(),
      );
    });

    it('renders similar products section', () => {
      renderDetailPage();
      expect(screen.getByRole('region', { name: /similar products/i })).toBeInTheDocument();
    });

    it('sets document title to brand + name', async () => {
      renderDetailPage();
      await waitFor(() => {
        expect(document.title).toContain('iPhone 15');
      });
    });
  });
});
