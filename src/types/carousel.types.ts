/** Input required to determine whether a carousel overflows horizontally. */
export type HorizontalOverflowInput = {
  /** Total scrollable width of the content. */
  scrollWidth: number;
  /** Visible width of the viewport. */
  clientWidth: number;
};

/** Input required to calculate normalized carousel scroll progress. */
export type ScrollProgressInput = HorizontalOverflowInput & {
  /** Current horizontal scroll offset. */
  scrollLeft: number;
};

/** Input required to position the custom scrollbar thumb. */
export type ScrollbarTrackOffsetInput = {
  /** Normalized scroll progress from `0` to `1`. */
  scrollProgress: number;
  /** Width of the full scrollbar container. */
  scrollbarWidth: number;
  /** Width of the scrollbar thumb. */
  trackWidth: number;
};

/** Input required to calculate all custom scrollbar metrics in one pass. */
export type CarouselScrollbarMetricsInput = ScrollProgressInput & {
  /** Width of the full scrollbar container. */
  scrollbarWidth: number;
  /** Width of the scrollbar thumb. */
  trackWidth: number;
};

/** Derived metrics used to render the custom carousel scrollbar. */
export type CarouselScrollbarMetrics = {
  /** Normalized scroll progress from `0` to `1`. */
  scrollProgress: number;
  /** Left offset in pixels for the scrollbar thumb. */
  trackOffset: number;
};
