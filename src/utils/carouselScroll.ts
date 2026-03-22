import type {
  CarouselScrollbarMetrics,
  CarouselScrollbarMetricsInput,
  HorizontalOverflowInput,
  ScrollbarTrackOffsetInput,
  ScrollProgressInput,
} from '@/types/carousel.types';

/**
 * Clamps a value between a minimum and maximum bound.
 *
 * @param value - The value to clamp
 * @param min - The minimum allowed value
 * @param max - The maximum allowed value
 * @returns The clamped value
 */
const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

/**
 * Determines if a scrollable element has horizontal overflow.
 *
 * @param params - Object containing scrollWidth and clientWidth
 * @returns True if content overflows horizontally, false otherwise
 */
export const hasHorizontalOverflow = ({
  scrollWidth,
  clientWidth,
}: HorizontalOverflowInput): boolean => {
  return scrollWidth > clientWidth;
};

/**
 * Calculates the scroll progress as a normalized value between 0 and 1.
 * Returns 0 if there is no scrollable distance.
 *
 * @param params - Object containing scrollLeft, scrollWidth, and clientWidth
 * @returns Scroll progress from 0 (start) to 1 (end)
 */
export const getScrollProgress = ({
  scrollLeft,
  scrollWidth,
  clientWidth,
}: ScrollProgressInput): number => {
  const maxScrollableDistance = scrollWidth - clientWidth;

  if (maxScrollableDistance <= 0) {
    return 0;
  }

  return clamp(scrollLeft / maxScrollableDistance, 0, 1);
};

/**
 * Calculates the horizontal offset for a custom scrollbar track indicator.
 * The offset represents how far the track should be positioned from the left edge.
 *
 * @param params - Object containing scrollProgress, scrollbarWidth, and trackWidth
 * @returns The horizontal offset in pixels for the scrollbar track
 */
export const getScrollbarTrackOffset = ({
  scrollProgress,
  scrollbarWidth,
  trackWidth,
}: ScrollbarTrackOffsetInput): number => {
  const availableTrackDistance = Math.max(scrollbarWidth - trackWidth, 0);
  return availableTrackDistance * clamp(scrollProgress, 0, 1);
};

/**
 * Calculates all metrics needed for positioning a custom carousel scrollbar.
 * Combines scroll progress calculation with track offset calculation.
 *
 * @param params - Object containing scroll dimensions and scrollbar dimensions
 * @returns Object with scrollProgress and trackOffset values
 *
 * @example
 * ```ts
 * const metrics = getCarouselScrollbarMetrics({
 *   scrollLeft: carousel.scrollLeft,
 *   scrollWidth: carousel.scrollWidth,
 *   clientWidth: carousel.clientWidth,
 *   scrollbarWidth: 300,
 *   trackWidth: 150,
 * });
 * track.style.left = `${metrics.trackOffset}px`;
 * ```
 */
export const getCarouselScrollbarMetrics = ({
  scrollLeft,
  scrollWidth,
  clientWidth,
  scrollbarWidth,
  trackWidth,
}: CarouselScrollbarMetricsInput): CarouselScrollbarMetrics => {
  const scrollProgress = getScrollProgress({
    scrollLeft,
    scrollWidth,
    clientWidth,
  });

  return {
    scrollProgress,
    trackOffset: getScrollbarTrackOffset({
      scrollProgress,
      scrollbarWidth,
      trackWidth,
    }),
  };
};
