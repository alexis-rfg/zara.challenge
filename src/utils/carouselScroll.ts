type HorizontalOverflowInput = {
  scrollWidth: number;
  clientWidth: number;
};

type ScrollProgressInput = HorizontalOverflowInput & {
  scrollLeft: number;
};

type ScrollbarTrackOffsetInput = {
  scrollProgress: number;
  scrollbarWidth: number;
  trackWidth: number;
};

export type CarouselScrollbarMetrics = {
  scrollProgress: number;
  trackOffset: number;
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const hasHorizontalOverflow = ({
  scrollWidth,
  clientWidth,
}: HorizontalOverflowInput): boolean => {
  return scrollWidth > clientWidth;
};

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

export const getScrollbarTrackOffset = ({
  scrollProgress,
  scrollbarWidth,
  trackWidth,
}: ScrollbarTrackOffsetInput): number => {
  const availableTrackDistance = Math.max(scrollbarWidth - trackWidth, 0);
  return availableTrackDistance * clamp(scrollProgress, 0, 1);
};

export const getCarouselScrollbarMetrics = ({
  scrollLeft,
  scrollWidth,
  clientWidth,
  scrollbarWidth,
  trackWidth,
}: ScrollProgressInput &
  Pick<ScrollbarTrackOffsetInput, 'scrollbarWidth' | 'trackWidth'>): CarouselScrollbarMetrics => {
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
