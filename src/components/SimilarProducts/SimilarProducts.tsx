import { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ProductSummary } from '@/types/product.types';
import { PhoneCard } from '@/components/PhoneCard/PhoneCard';
import { getCarouselScrollbarMetrics, hasHorizontalOverflow } from '@/utils/carouselScroll';
import './SimilarProducts.scss';

/**
 * Props for the SimilarProducts component.
 */
export type SimilarProductsProps = {
  /** Array of similar product summaries to display in the carousel */
  products: ProductSummary[];
};

/**
 * Horizontal carousel component displaying similar products with a custom scrollbar.
 * Features smooth horizontal scrolling with a visual scrollbar indicator that tracks scroll position.
 * The scrollbar only appears when content overflows horizontally.
 *
 * @param props - Component props
 * @returns A horizontal scrollable carousel of product cards with custom scrollbar
 *
 * @example
 * ```tsx
 * <SimilarProducts products={product.similarProducts} />
 * ```
 */
export const SimilarProducts = ({ products }: SimilarProductsProps) => {
  const { t } = useTranslation();
  const carouselRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  useEffect(() => {
    const carousel = carouselRef.current;

    if (!carousel) return;

    const checkOverflow = () => {
      setHasOverflow(
        hasHorizontalOverflow({
          scrollWidth: carousel.scrollWidth,
          clientWidth: carousel.clientWidth,
        }),
      );
    };

    // Check overflow on mount and resize
    checkOverflow();
    window.addEventListener('resize', checkOverflow);

    return () => {
      window.removeEventListener('resize', checkOverflow);
    };
  }, [products]);

  useEffect(() => {
    const carousel = carouselRef.current;
    const track = trackRef.current;

    if (!carousel || !track || !hasOverflow) return;

    const handleScroll = () => {
      const { trackOffset } = getCarouselScrollbarMetrics({
        scrollLeft: carousel.scrollLeft,
        scrollWidth: carousel.scrollWidth,
        clientWidth: carousel.clientWidth,
        scrollbarWidth: track.parentElement?.clientWidth ?? carousel.clientWidth,
        trackWidth: track.offsetWidth,
      });

      track.style.left = `${trackOffset}px`;
    };

    carousel.addEventListener('scroll', handleScroll);

    // Initial position
    handleScroll();

    return () => {
      carousel.removeEventListener('scroll', handleScroll);
    };
  }, [hasOverflow]);

  if (products.length === 0) return null;

  return (
    <section className="similar-products" aria-label={t('similarProducts.ariaLabel')}>
      <div className="similar-products__content">
        <h2 className="similar-products__heading">{t('similarProducts.heading')}</h2>
        <div className="similar-products__carousel-wrapper" ref={carouselRef}>
          <div className="similar-products__carousel">
            {products.map((product) => (
              <div key={product.id} className="similar-products__item">
                <PhoneCard product={product} />
              </div>
            ))}
          </div>
        </div>
        {hasOverflow && (
          <div className="similar-products__scrollbar">
            <div className="similar-products__scrollbar-track" ref={trackRef} />
          </div>
        )}
      </div>
    </section>
  );
};
