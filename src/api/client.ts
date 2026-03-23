import { env } from '@/env';
import type { CacheEntry } from '@/types/api.types';
import { createLogger } from '@/utils/logger';

const API_BASE_URL = env().baseUrl;
const API_KEY = env().apiKey;
const API_REQUEST_TIMEOUT_MS = 15_000;
const apiLogger = createLogger({
  scope: 'api.client',
  tags: ['api', 'http'],
});

/**
 * Represents an error returned by the API layer.
 *
 * Extends the native `Error` with the HTTP status code and status text so
 * callers can branch on specific failure modes (e.g. 404 vs 500) without
 * having to parse the message string.
 *
 * @example
 * ```ts
 * try {
 *   await apiClient('/products/unknown-id');
 * } catch (err) {
 *   if (err instanceof ApiError && err.status === 404) {
 *     // product not found
 *   }
 * }
 * ```
 */
export class ApiError extends Error {
  constructor(
    message: string,
    /** HTTP status code returned by the server (e.g. 404, 500) */
    public status: number,
    /** HTTP status text returned by the server (e.g. "Not Found", "Internal Server Error") */
    public statusText: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Represents a request that exceeded the client-side timeout budget.
 */
export class ApiTimeoutError extends Error {
  constructor(
    /** Timeout budget in milliseconds. */
    public timeoutMs: number,
    message = `API request timed out after ${timeoutMs / 1000} seconds`,
  ) {
    super(message);
    this.name = 'ApiTimeoutError';
  }
}

// In-memory response cache
//
// Why this exists:
//   The product catalog API lives on a free Render.com instance with ~500ms
//   cold-start latency. Without a cache every page revisit and every React
//   StrictMode double-mount fires a real network request, making the app feel
//   sluggish.
//
// How it works:
//   Each successful response is stored against its full URL. On the next call
//   for the same URL the cached value is returned immediately if it has not
//   yet expired (TTL = 5 minutes). After the TTL the entry is stale and the
//   next call triggers a fresh network request that repopulates the cache.
//
// Scope:
//   The cache is module-level, meaning it lives for the lifetime of the
//   browser tab (cleared on hard refresh or tab close). It is intentionally
//   NOT shared across tabs.

/** How long a cached response is considered fresh before the next network call. */
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Module-level store that maps absolute request URLs to their cached responses.
 *
 * Using a `Map` instead of a plain object ensures insertion-order iteration
 * and avoids prototype-pollution risks with arbitrary URL keys.
 */
const responseCache = new Map<string, CacheEntry>();

// ── Prefetch bridge ───────────────────────────────────────────────────────
// public/prefetch.js starts the initial API call before the JS bundle loads.
// We store that in-flight promise so apiClient can await it instead of
// issuing a duplicate network request.
const pendingPrefetches = new Map<string, Promise<unknown>>();

try {
  const win = globalThis as unknown as { __PREFETCH__?: { products?: Promise<unknown> } };
  if (win.__PREFETCH__?.products) {
    pendingPrefetches.set(`${API_BASE_URL}/products?limit=20`, win.__PREFETCH__.products);
    delete win.__PREFETCH__;
  }
} catch {
  /* SSR / test environments — ignore */
}

type RequestSignalState = {
  signal: AbortSignal;
  cleanup: () => void;
  timedOut: () => boolean;
};

/**
 * Combines the caller signal with a hard timeout so requests cannot hang forever.
 */
const createRequestSignal = (callerSignal?: AbortSignal): RequestSignalState => {
  const controller = new AbortController();
  let didTimeout = false;

  const abortFromCaller = () => controller.abort();

  if (callerSignal?.aborted) {
    controller.abort();
  } else {
    callerSignal?.addEventListener('abort', abortFromCaller, { once: true });
  }

  const timeoutId = globalThis.setTimeout(() => {
    didTimeout = true;
    controller.abort();
  }, API_REQUEST_TIMEOUT_MS);

  return {
    signal: controller.signal,
    cleanup: () => {
      globalThis.clearTimeout(timeoutId);
      callerSignal?.removeEventListener('abort', abortFromCaller);
    },
    timedOut: () => didTimeout,
  };
};

/**
 * Generic, authenticated HTTP client for the product catalog API.
 *
 * Every request automatically receives the `x-api-key` header required by the
 * backend. Responses are cached in memory for {@link CACHE_TTL_MS} ms so that
 * identical URL calls within the same session skip the network entirely.
 *
 * Request lifecycle:
 * 1. Cache check - if a fresh entry exists for the URL, return it immediately.
 * 2. Fetch - issue a `GET` with the API key header, the optional caller
 *    `AbortSignal`, and a hard client timeout budget.
 * 3. Error handling - non-2xx responses throw `ApiError`; timeout expiry
 *    throws `ApiTimeoutError`; network failures throw a plain `Error`;
 *    intentional aborts (StrictMode cleanup, navigation away) re-throw
 *    `DOMException(AbortError)` unchanged so callers can distinguish them from
 *    real failures.
 * 4. Cache population - successful responses are stored before returning.
 *
 * @template T - Shape of the expected JSON response body.
 * @param endpoint - Path relative to the API base URL (e.g. `'/products?limit=20'`).
 * @param signal - Optional `AbortSignal` from an `AbortController`. When
 *   aborted the underlying `fetch` rejects with a `DOMException` whose
 *   `.name === 'AbortError'`.
 * @returns The parsed JSON body cast to `T`.
 * @throws {ApiError} The server responded with a non-2xx status.
 * @throws {ApiTimeoutError} The request exceeded the client-side timeout budget.
 * @throws {DOMException} The request was intentionally cancelled via `signal`.
 * @throws {Error} A network-level failure occurred (DNS, offline, etc.).
 *
 * @example
 * ```ts
 * // Basic usage
 * const products = await apiClient<ProductSummary[]>('/products?limit=20');
 *
 * // Cancellable usage (e.g. inside a useEffect)
 * const controller = new AbortController();
 * const product = await apiClient<ProductDetail>('/products/APL-IP15P', controller.signal);
 * // Later: controller.abort();
 * ```
 */
export const apiClient = async <T>(endpoint: string, signal?: AbortSignal): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;

  // Return cached response if still fresh - avoids a network round-trip for
  // repeated calls to the same URL (e.g. navigating back to the home page or
  // React StrictMode's second effect invocation in development).
  const cached = responseCache.get(url);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data as T;
  }

  // Consume inline prefetch if available — avoids a duplicate network request.
  const prefetch = pendingPrefetches.get(url);
  if (prefetch) {
    pendingPrefetches.delete(url);
    try {
      const prefetchData = await prefetch;
      if (prefetchData) {
        responseCache.set(url, { data: prefetchData, expiresAt: Date.now() + CACHE_TTL_MS });
        apiLogger.info('prefetch_consumed', {
          tags: ['cache', 'prefetch'],
          context: { endpoint },
        });
        return prefetchData as T;
      }
    } catch {
      /* prefetch failed — fall through to normal fetch */
    }
  }

  const requestSpan = apiLogger.startSpan('request', {
    tags: ['fetch'],
    context: { endpoint, method: 'GET', url },
  });
  const requestSignal = createRequestSignal(signal);

  try {
    const response = await fetch(url, {
      headers: { 'x-api-key': API_KEY },
      signal: requestSignal.signal,
    });

    if (!response.ok) {
      const apiError = new ApiError(
        `API request failed: ${response.status} ${response.statusText}`,
        response.status,
        response.statusText,
      );

      requestSpan.fail(apiError, {
        tags: ['response', 'error'],
        context: {
          endpoint,
          method: 'GET',
          status: response.status,
          statusText: response.statusText,
        },
      });

      throw apiError;
    }

    const data = (await response.json()) as T;

    // Populate the cache so subsequent identical requests skip the network.
    responseCache.set(url, { data, expiresAt: Date.now() + CACHE_TTL_MS });

    requestSpan.finish({
      tags: ['response', 'success'],
      context: {
        endpoint,
        method: 'GET',
        status: response.status,
        statusText: response.statusText,
      },
    });

    return data;
  } catch (error) {
    // AbortError is intentional (React StrictMode cleanup, user navigating away
    // before the response arrives). Re-throw as-is so hooks can silently ignore
    // it without logging a false-positive error.
    if (error instanceof DOMException && error.name === 'AbortError') {
      if (requestSignal.timedOut()) {
        const timeoutError = new ApiTimeoutError(API_REQUEST_TIMEOUT_MS);

        requestSpan.fail(timeoutError, {
          tags: ['timeout', 'error'],
          context: {
            endpoint,
            method: 'GET',
            timeoutMs: API_REQUEST_TIMEOUT_MS,
          },
        });

        throw timeoutError;
      }

      throw error;
    }

    // ApiError and ApiTimeoutError are already classified - re-throw as-is.
    if (error instanceof ApiError || error instanceof ApiTimeoutError) {
      throw error;
    }

    const networkError = new Error(
      `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );

    requestSpan.fail(networkError, {
      tags: ['network', 'error'],
      context: { endpoint, method: 'GET' },
    });

    throw networkError;
  } finally {
    requestSignal.cleanup();
  }
};
