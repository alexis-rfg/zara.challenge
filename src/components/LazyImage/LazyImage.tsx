import { useState, useCallback } from 'react';
import type { ImgHTMLAttributes, SyntheticEvent } from 'react';
import './LazyImage.scss';

/**
 * Props for the {@link LazyImage} component.
 *
 * Extends every native `<img>` attribute so the component is a drop-in
 * replacement. The only addition is `eager` which opts out of lazy loading
 * for above-the-fold images (e.g. the product-detail hero).
 */
type LazyImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  /** When `true`, sets `loading="eager"` (default `false` → `"lazy"`). */
  eager?: boolean;
};

/**
 * Progressive image component with native lazy loading and a fade-in reveal.
 *
 * - Uses `loading="lazy"` by default so the browser defers off-screen fetches.
 * - Adds `decoding="async"` to avoid blocking the main thread.
 * - Starts at `opacity: 0` and transitions to `opacity: 1` once the image's
 *   `onLoad` fires, producing a smooth fade-in effect.
 * - Applies an `--errored` modifier on load failure for graceful degradation.
 * - Respects `prefers-reduced-motion` (see LazyImage.scss).
 *
 * @example
 * ```tsx
 * // Lazy (default) — grid cards, similar products, cart items
 * <LazyImage src={url} alt="Galaxy S24" className="phone-card__image" />
 *
 * // Eager — above-the-fold hero image
 * <LazyImage eager src={url} alt="iPhone 15 Pro" className="detail__image" />
 * ```
 */
export const LazyImage = ({
  eager = false,
  className = '',
  alt = '',
  onLoad,
  onError,
  ...rest
}: LazyImageProps) => {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const handleLoad = useCallback(
    (e: SyntheticEvent<HTMLImageElement>) => {
      setLoaded(true);
      onLoad?.(e);
    },
    [onLoad],
  );

  const handleError = useCallback(
    (e: SyntheticEvent<HTMLImageElement>) => {
      setErrored(true);
      onError?.(e);
    },
    [onError],
  );

  return (
    <img
      {...rest}
      alt={alt}
      className={`lazy-image${loaded ? ' lazy-image--loaded' : ''}${errored ? ' lazy-image--errored' : ''} ${className}`.trim()}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onLoad={handleLoad}
      onError={handleError}
    />
  );
};
