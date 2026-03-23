import { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { SimilarProductsProps } from '@/types/components.types';
import { PhoneCard } from '@/components/PhoneCard/PhoneCard';
import { getCarouselScrollbarMetrics, hasHorizontalOverflow } from '@/utils/carouselScroll';
import './SimilarProducts.scss';

type ScrollbarMeasurements = {
  scrollWidth: number;
  clientWidth: number;
  scrollbarWidth: number;
  trackWidth: number;
};

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
  const scrollbarMeasurementsRef = useRef<ScrollbarMeasurements>({
    scrollWidth: 0,
    clientWidth: 0,
    scrollbarWidth: 0,
    trackWidth: 0,
  });
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
    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(checkOverflow) : null;

    resizeObserver?.observe(carousel);
    window.addEventListener('resize', checkOverflow);

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener('resize', checkOverflow);
    };
  }, [products]);

  useEffect(() => {
    const carousel = carouselRef.current;
    const track = trackRef.current;

    if (!carousel || !track || !hasOverflow) return;

    /**
     * Captures layout-dependent measurements outside the scroll handler so
     * scrolling only performs a cheap transform update.
     */
    const measureScrollbar = () => {
      scrollbarMeasurementsRef.current = {
        scrollWidth: carousel.scrollWidth,
        clientWidth: carousel.clientWidth,
        scrollbarWidth: track.parentElement?.clientWidth ?? carousel.clientWidth,
        trackWidth: track.offsetWidth,
      };
    };

    /**
     * Syncs the custom scrollbar thumb position with the carousel scroll offset.
     */
    const handleScroll = () => {
      const { scrollWidth, clientWidth, scrollbarWidth, trackWidth } =
        scrollbarMeasurementsRef.current;
      const { trackOffset } = getCarouselScrollbarMetrics({
        scrollLeft: carousel.scrollLeft,
        scrollWidth,
        clientWidth,
        scrollbarWidth,
        trackWidth,
      });

      track.style.transform = `translate3d(${trackOffset}px, 0, 0)`;
    };

    measureScrollbar();
    carousel.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', measureScrollbar);

    const resizeObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measureScrollbar) : null;

    resizeObserver?.observe(carousel);
    if (track.parentElement) {
      resizeObserver?.observe(track.parentElement);
    }
    handleScroll();

    return () => {
      carousel.removeEventListener('scroll', handleScroll);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', measureScrollbar);
    };
  }, [hasOverflow]);

  if (products.length === 0) return null;

  const carouselItems = products.map((product) => (
    <div key={product.id} className="similar-products__item">
      <PhoneCard product={product} headingTag="h3" />
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
