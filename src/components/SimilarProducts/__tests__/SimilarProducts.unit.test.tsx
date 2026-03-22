import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SimilarProducts } from '../SimilarProducts';
import * as carouselScroll from '@/utils/carouselScroll';
import type * as CarouselScrollUtils from '@/utils/carouselScroll';
import productFixtures from '@/test/fixtures/products.json';

vi.mock('@/utils/carouselScroll', async (importOriginal) => {
  const actual = await importOriginal<typeof CarouselScrollUtils>();
  return { ...actual };
});

const mockProducts = [productFixtures.galaxyS24, productFixtures.iPhone15, productFixtures.pixel8];

const renderWithRouter = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('SimilarProducts', () => {
  it('renders nothing when products array is empty', () => {
    const { container } = renderWithRouter(<SimilarProducts products={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a section with accessible label', () => {
    renderWithRouter(<SimilarProducts products={mockProducts} />);
    expect(screen.getByRole('region', { name: /similar products/i })).toBeInTheDocument();
  });

  it('renders SIMILAR ITEMS heading', () => {
    renderWithRouter(<SimilarProducts products={mockProducts} />);
    expect(screen.getByRole('heading', { name: /similar items/i })).toBeInTheDocument();
  });

  it('renders a card for each product', () => {
    renderWithRouter(<SimilarProducts products={mockProducts} />);
    expect(screen.getByRole('link', { name: /galaxy s24/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /iphone 15/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /pixel 8/i })).toBeInTheDocument();
  });

  it('each card navigates to the correct product detail route', () => {
    renderWithRouter(<SimilarProducts products={mockProducts} />);
    expect(screen.getByRole('link', { name: /galaxy s24/i })).toHaveAttribute(
      'href',
      `/products/${productFixtures.galaxyS24.id}`,
    );
  });

  it('shows scrollbar when carousel overflows', () => {
    vi.spyOn(carouselScroll, 'hasHorizontalOverflow').mockReturnValue(true);

    renderWithRouter(<SimilarProducts products={mockProducts} />);

    expect(document.querySelector('.similar-products__scrollbar')).toBeInTheDocument();
  });

  it('scroll event updates scrollbar track position', () => {
    vi.spyOn(carouselScroll, 'hasHorizontalOverflow').mockReturnValue(true);
    vi.spyOn(carouselScroll, 'getCarouselScrollbarMetrics').mockReturnValue({
      scrollProgress: 0.5,
      trackOffset: 80,
    });

    renderWithRouter(<SimilarProducts products={mockProducts} />);

    const carousel = document.querySelector('.similar-products__carousel-wrapper');
    fireEvent.scroll(carousel as Element);

    const track = document.querySelector('.similar-products__scrollbar-track') as HTMLElement;
    expect(track?.style.left).toBe('80px');
  });

  it('does NOT show scrollbar when no overflow', () => {
    vi.spyOn(carouselScroll, 'hasHorizontalOverflow').mockReturnValue(false);

    renderWithRouter(<SimilarProducts products={mockProducts} />);

    expect(document.querySelector('.similar-products__scrollbar')).not.toBeInTheDocument();
  });
});
