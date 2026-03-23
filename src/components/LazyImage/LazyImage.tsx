import { useState, useCallback } from 'react';
import type { SyntheticEvent } from 'react';
import type { LazyImageProps } from '@/types/components.types';
import './LazyImage.scss';

/**
 * Progressive image component with native lazy loading and a fade-in reveal.
 *
 * @param props - Component props.
 * @returns Enhanced img element with loading states.
 */
export const LazyImage = ({
  eager = false,
  className = '',
  alt = '',
  onLoad,
  onError,
  fetchPriority,
  ...rest
}: LazyImageProps) => {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const loadingStrategy = eager ? 'eager' : 'lazy';
  const resolvedFetchPriority = fetchPriority ?? (eager ? 'high' : null);
  const computedClassName =
    `lazy-image${loaded || eager ? ' lazy-image--loaded' : ''}${errored ? ' lazy-image--errored' : ''} ${className}`.trim();

  /**
   * Marks the image as loaded and forwards the load event.
   *
   * @param e - Synthetic image load event.
   */
  const handleLoad = useCallback(
    (e: SyntheticEvent<HTMLImageElement>) => {
      setLoaded(true);
      onLoad?.(e);
    },
    [onLoad],
  );

  /**
   * Marks the image as errored and forwards the error event.
   *
   * @param e - Synthetic image error event.
   */
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
      className={computedClassName}
      loading={loadingStrategy}
      {...(resolvedFetchPriority ? { fetchPriority: resolvedFetchPriority } : {})}
      decoding="async"
      onLoad={handleLoad}
      onError={handleError}
    />
  );
};
