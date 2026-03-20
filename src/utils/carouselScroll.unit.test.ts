import { describe, expect, it } from 'vitest';
import {
  getCarouselScrollbarMetrics,
  getScrollProgress,
  getScrollbarTrackOffset,
  hasHorizontalOverflow,
} from './carouselScroll';

describe('carouselScroll utilities - Unit Tests', () => {
  describe('hasHorizontalOverflow', () => {
    it('should return true when content is wider than the viewport', () => {
      expect(hasHorizontalOverflow({ scrollWidth: 1800, clientWidth: 1200 })).toBe(true);
    });

    it('should return false when content fits the viewport', () => {
      expect(hasHorizontalOverflow({ scrollWidth: 1200, clientWidth: 1200 })).toBe(false);
    });
  });

  describe('getScrollProgress', () => {
    it('should return 0 when there is no scrollable overflow', () => {
      expect(
        getScrollProgress({
          scrollLeft: 120,
          scrollWidth: 1200,
          clientWidth: 1200,
        }),
      ).toBe(0);
    });

    it('should calculate the scroll progress from the available scroll distance', () => {
      expect(
        getScrollProgress({
          scrollLeft: 300,
          scrollWidth: 1800,
          clientWidth: 1200,
        }),
      ).toBe(0.5);
    });

    it('should clamp the progress between 0 and 1', () => {
      expect(
        getScrollProgress({
          scrollLeft: -50,
          scrollWidth: 1800,
          clientWidth: 1200,
        }),
      ).toBe(0);

      expect(
        getScrollProgress({
          scrollLeft: 9999,
          scrollWidth: 1800,
          clientWidth: 1200,
        }),
      ).toBe(1);
    });
  });

  describe('getScrollbarTrackOffset', () => {
    it('should return the correct offset inside the scrollbar track', () => {
      expect(
        getScrollbarTrackOffset({
          scrollProgress: 0.5,
          scrollbarWidth: 600,
          trackWidth: 150,
        }),
      ).toBe(225);
    });

    it('should never return a negative offset', () => {
      expect(
        getScrollbarTrackOffset({
          scrollProgress: 0.5,
          scrollbarWidth: 100,
          trackWidth: 150,
        }),
      ).toBe(0);
    });
  });

  describe('getCarouselScrollbarMetrics', () => {
    it('should compose progress and track offset calculations', () => {
      expect(
        getCarouselScrollbarMetrics({
          scrollLeft: 150,
          scrollWidth: 1800,
          clientWidth: 1200,
          scrollbarWidth: 600,
          trackWidth: 150,
        }),
      ).toEqual({
        scrollProgress: 0.25,
        trackOffset: 112.5,
      });
    });
  });
});
