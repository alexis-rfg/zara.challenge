import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { PhoneCard } from '../PhoneCard';
import type { ProductSummary } from '@/types/product.types';

const mockProduct: ProductSummary = {
  id: 'test-phone-1',
  brand: 'Samsung',
  name: 'Galaxy S24 Ultra',
  basePrice: 1329,
  imageUrl: 'https://example.com/phone.webp',
};

const renderWithRouter = (ui: React.ReactElement) => {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
};

describe('PhoneCard', () => {
  it('renders product information correctly', () => {
    renderWithRouter(<PhoneCard product={mockProduct} />);

    expect(screen.getByText('Samsung')).toBeInTheDocument();
    expect(screen.getByText('Galaxy S24 Ultra')).toBeInTheDocument();
    expect(screen.getByText('1329 €')).toBeInTheDocument();
  });

  it('renders product image with correct alt text', () => {
    renderWithRouter(<PhoneCard product={mockProduct} />);

    const image = screen.getByAltText('Samsung Galaxy S24 Ultra');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', mockProduct.imageUrl);
  });

  it('image has lazy loading attribute', () => {
    renderWithRouter(<PhoneCard product={mockProduct} />);

    const image = screen.getByAltText('Samsung Galaxy S24 Ultra');
    expect(image).toHaveAttribute('loading', 'lazy');
  });

  it('links to product detail page', () => {
    renderWithRouter(<PhoneCard product={mockProduct} />);

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/products/test-phone-1');
  });

  it('formats price correctly for different amounts', () => {
    const productWithDifferentPrice: ProductSummary = {
      ...mockProduct,
      basePrice: 999,
    };

    renderWithRouter(<PhoneCard product={productWithDifferentPrice} />);

    expect(screen.getByText('999 €')).toBeInTheDocument();
  });

  it('formats price with thousands separator', () => {
    const expensiveProduct: ProductSummary = {
      ...mockProduct,
      basePrice: 1999,
    };

    renderWithRouter(<PhoneCard product={expensiveProduct} />);

    expect(screen.getByText('1999 €')).toBeInTheDocument();
  });

  it('renders as an article element for semantic HTML', () => {
    const { container } = renderWithRouter(<PhoneCard product={mockProduct} />);

    const article = container.querySelector('article');
    expect(article).toBeInTheDocument();
  });

  it('brand text is uppercase styled', () => {
    renderWithRouter(<PhoneCard product={mockProduct} />);

    const brand = screen.getByText('Samsung');
    expect(brand).toHaveClass('phone-card__brand');
  });

  it('handles products with special characters in name', () => {
    const productWithSpecialChars: ProductSummary = {
      ...mockProduct,
      name: 'iPhone 15 Pro Max (256GB)',
    };

    renderWithRouter(<PhoneCard product={productWithSpecialChars} />);

    expect(screen.getByText('iPhone 15 Pro Max (256GB)')).toBeInTheDocument();
  });

  it('handles long product names', () => {
    const productWithLongName: ProductSummary = {
      ...mockProduct,
      name: 'Galaxy S24 Ultra 5G with Advanced AI Camera System',
    };

    renderWithRouter(<PhoneCard product={productWithLongName} />);

    expect(
      screen.getByText('Galaxy S24 Ultra 5G with Advanced AI Camera System'),
    ).toBeInTheDocument();
  });
});
