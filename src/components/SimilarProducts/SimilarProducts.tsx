import { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { SimilarProductsProps } from '@/types/components.types';
import { PhoneCard } from '@/components/PhoneCard/PhoneCard';
import { getCarouselScrollbarMetrics, hasHorizontalOverflow } from '@/utils/carouselScroll';
import './SimilarProducts.scss';

/**
 * Horizontal carousel component displaying similar products with a custom scrollbar.
 *
 * @param props - Component props.
 * @returns Scrollable carousel of product cards with custom scrollbar.
 */
export const SimilarProducts = ({ products }: SimilarProductsProps) => {
  const { t } = useTranslation();
  const carouselRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  useEffect(() => {
    const carousel = carouselRef.current;

    if (!carousel) return;

    /**
     * Recomputes whether the carousel content overflows its viewport.
     */
    const checkOverflow = () => {
      setHasOverflow(
        hasHorizontalOverflow({
          scrollWidth: carousel.scrollWidth,
          clientWidth: carousel.clientWidth,
        }),
      );
    };

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

    /**
     * Syncs the custom scrollbar thumb position with the carousel scroll offset.
     */
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
    handleScroll();

    return () => {
      carousel.removeEventListener('scroll', handleScroll);
    };
  }, [hasOverflow]);

  if (products.length === 0) return null;

  const carouselItems = products.map((product) => (
    <div key={product.id} className="similar-products__item">
      <PhoneCard product={product} />
    </div>
  ));

  const scrollbar = hasOverflow ? (
    <div className="similar-products__scrollbar">
      <div className="similar-products__scrollbar-track" ref={trackRef} />
    </div>
  ) : null;

  return (
    <section className="similar-products" aria-label={t('similarProducts.ariaLabel')}>
      <div className="similar-products__content">
        <h2 className="similar-products__heading">{t('similarProducts.heading')}</h2>
        <div className="similar-products__carousel-wrapper" ref={carouselRef}>
          <div className="similar-products__carousel">{carouselItems}</div>
        </div>
        {scrollbar}
      </div>
    </section>
  );
};
