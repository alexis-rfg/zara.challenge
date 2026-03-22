/** Cached API response entry stored in the in-memory client cache. */
export type CacheEntry = {
  /** Parsed JSON payload returned by the API. */
  data: unknown;
  /** Unix timestamp in milliseconds when the cache entry expires. */
  expiresAt: number;
};
