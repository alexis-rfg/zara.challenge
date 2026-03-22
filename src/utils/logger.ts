import type { LogLevel, LogContext, SerializedError, LogEntry } from './logger.types';

export type { LogLevel, LogContext, SerializedError, LogEntry };

/** Callback invoked for every log entry emitted to the in-memory buffer. */
export type LogListener = (entry: LogEntry) => void;

/** Options accepted by every log method and by `startSpan`. */
export type LogEventOptions = {
  /** Additional tags merged with the logger's default tags. */
  tags?: string[];
  /** Structured key-value data merged with the logger's default context. */
  context?: LogContext;
  /** Correlation ID used to link related log entries (e.g. span start/end). */
  correlationId?: string;
  /** Duration in milliseconds — set automatically by `startSpan`. */
  durationMs?: number;
  /** Error to serialise and attach to the entry. */
  error?: unknown;
};

/** Configuration provided when creating a new logger instance. */
export type LoggerConfig = {
  /** Dot-separated module path that appears in every entry (e.g. `'api.client'`). */
  scope: string;
  /** Default tags applied to every entry from this logger. */
  tags?: string[];
  /** Default context merged into every entry from this logger. */
  context?: LogContext;
};

/** Options accepted by `finish` and `fail` on a span — excludes fields set automatically. */
export type SpanCloseOptions = Omit<LogEventOptions, 'correlationId' | 'durationMs'>;

/**
 * Public interface exposed by every logger instance created via {@link createLogger}.
 *
 * All log methods return the emitted {@link LogEntry} so callers can inspect or
 * forward it if needed. `startSpan` returns a span handle whose `finish`/`fail`
 * methods automatically measure elapsed time.
 */
export type LoggerApi = {
  debug: (event: string, options?: LogEventOptions) => LogEntry;
  info: (event: string, options?: LogEventOptions) => LogEntry;
  warn: (event: string, options?: LogEventOptions) => LogEntry;
  error: (event: string, options?: LogEventOptions) => LogEntry;
  /** Creates a child logger whose scope is `parent.child` and whose tags/context are merged. */
  child: (config: Omit<LoggerConfig, 'context'> & { context?: LogContext }) => LoggerApi;
  /**
   * Starts a timed operation span. Emits a `.started` debug entry immediately
   * and returns a handle to emit `.finished` (info) or `.failed` (error) on close.
   */
  startSpan: (
    event: string,
    options?: Omit<LogEventOptions, 'durationMs'>,
  ) => {
    correlationId: string;
    finish: (options?: SpanCloseOptions) => LogEntry;
    fail: (error: unknown, options?: SpanCloseOptions) => LogEntry;
  };
};

/**
 * Browser devtools API exposed on `window.__APP_LOGGER__` in non-test environments.
 * Allows reading, clearing, and subscribing to log entries from the browser console.
 */
type LoggerDevtoolsApi = {
  /** Empties the in-memory log buffer. */
  clear: () => void;
  /** Returns a shallow copy of the current log buffer. */
  getEntries: () => LogEntry[];
  /**
   * Registers a listener that is called for every future log entry.
   * @returns An unsubscribe function that removes the listener.
   */
  subscribe: (listener: LogListener) => () => void;
};

/** Maximum number of entries kept in {@link LOG_BUFFER} before the oldest is evicted. */
const MAX_BUFFER_SIZE = 200;

/** Circular in-memory buffer holding the most recent {@link MAX_BUFFER_SIZE} log entries. */
const LOG_BUFFER: LogEntry[] = [];

/** Set of active {@link LogListener} callbacks notified on every emitted entry. */
const LOG_LISTENERS = new Set<LogListener>();

/** Monotonically increasing counter used as a fallback ID when `crypto.randomUUID` is unavailable. */
let logSequence = 0;

/**
 * Returns a high-resolution timestamp in milliseconds.
 * Uses `performance.now()` when available (browser / Node ≥ 16) for sub-ms
 * precision; falls back to `Date.now()` in environments that lack the
 * Performance API (e.g. some test runners).
 */
const getNow = (): number => {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
};

/**
 * Generates a unique identifier for a log entry.
 * Prefers `crypto.randomUUID()` for collision-free IDs; falls back to a
 * timestamp + sequence number string in environments without the Web Crypto API.
 */
const createLogId = (): string => {
  logSequence += 1;

  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `log-${Date.now()}-${logSequence}`;
};

/**
 * Converts an arbitrary thrown value into a {@link SerializedError} suitable for
 * embedding in a {@link LogEntry}. Returns `undefined` for falsy values so that
 * `entry.error` is only set when there is actual error information.
 */
const serializeError = (error: unknown): SerializedError | undefined => {
  if (!error) {
    return undefined;
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      ...(error.stack ? { stack: error.stack } : {}),
    };
  }

  if (typeof error === 'string') {
    return {
      name: 'Error',
      message: error,
    };
  }

  return {
    name: 'UnknownError',
    message: JSON.stringify(error),
  };
};

/**
 * Merges multiple tag arrays into a single deduplicated array while preserving
 * the original order of first occurrence. Empty/undefined sets are skipped.
 */
const mergeTags = (...tagSets: Array<string[] | undefined>): string[] => {
  return [...new Set(tagSets.flatMap((tags) => tags ?? []).filter(Boolean))];
};

/**
 * Returns `true` when running in Vite's dev server (but not in test mode).
 * Used to gate the optional terminal-forwarding side effect so that tests and
 * production builds are never affected by it.
 */
const shouldForwardToTerminal = (): boolean => {
  if (typeof import.meta.env === 'undefined') return false;
  return import.meta.env.DEV && import.meta.env.MODE !== 'test';
};

/**
 * Fire-and-forgets a log entry to the local Vite dev-server endpoint
 * (`POST /api/dev-log`) so that structured logs appear in the terminal
 * alongside Vite's output. Failures are silently swallowed — the dev server
 * may not have the endpoint, and we never want logging to break the app.
 */
const forwardEntryToTerminal = (entry: LogEntry): void => {
  if (!shouldForwardToTerminal()) {
    return;
  }

  // Fire-and-forget — intentionally not awaited
  fetch('/api/dev-log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry),
  }).catch(() => {
    // Silently ignore — dev server may not be reachable
  });
};

/**
 * Appends an entry to {@link LOG_BUFFER}, evicts the oldest if the buffer is full,
 * notifies all registered {@link LOG_LISTENERS}, and optionally forwards to the
 * terminal in dev mode. Returns the entry so callers can chain or inspect it.
 */
const emitLog = (entry: LogEntry): LogEntry => {
  LOG_BUFFER.push(entry);

  if (LOG_BUFFER.length > MAX_BUFFER_SIZE) {
    LOG_BUFFER.shift();
  }

  LOG_LISTENERS.forEach((listener) => {
    listener(entry);
  });

  forwardEntryToTerminal(entry);

  return entry;
};

/**
 * Constructs a {@link LogEntry} by merging the logger's default config with
 * the per-call options. Context objects are shallow-merged; tags are
 * deduplicated via {@link mergeTags}. Optional fields (`context`, `correlationId`,
 * `durationMs`, `error`) are only written when they have a value, keeping
 * entries lean.
 */
const buildEntry = (
  config: LoggerConfig,
  level: LogLevel,
  event: string,
  options?: LogEventOptions,
): LogEntry => {
  const mergedContext =
    config.context || options?.context
      ? {
          ...(config.context ?? {}),
          ...(options?.context ?? {}),
        }
      : undefined;

  const entry: LogEntry = {
    id: createLogId(),
    timestamp: new Date().toISOString(),
    level,
    scope: config.scope,
    event,
    tags: mergeTags(config.tags, options?.tags),
  };

  if (mergedContext) entry.context = mergedContext;
  if (options?.correlationId) entry.correlationId = options.correlationId;
  if (options?.durationMs !== undefined) entry.durationMs = options.durationMs;
  const serializedError = serializeError(options?.error);
  if (serializedError) entry.error = serializedError;

  return entry;
};

/**
 * Builds a {@link LoggerApi} object bound to the given `config`.
 *
 * All four level methods delegate to a shared `logAtLevel` helper so that
 * the only difference between them is the severity string. `child` creates a
 * new API whose scope is `parent.child` and whose tags/context inherit from the
 * parent. `startSpan` captures a start timestamp and returns a handle that
 * calculates `durationMs` automatically when closed.
 */
const createLoggerApi = (config: LoggerConfig): LoggerApi => {
  const logAtLevel = (level: LogLevel, event: string, options?: LogEventOptions): LogEntry => {
    return emitLog(buildEntry(config, level, event, options));
  };

  return {
    debug: (event, options) => logAtLevel('debug', event, options),
    info: (event, options) => logAtLevel('info', event, options),
    warn: (event, options) => logAtLevel('warn', event, options),
    error: (event, options) => logAtLevel('error', event, options),
    child: (childConfig) =>
      createLoggerApi({
        scope: `${config.scope}.${childConfig.scope}`,
        tags: mergeTags(config.tags, childConfig.tags),
        context: {
          ...(config.context ?? {}),
          ...(childConfig.context ?? {}),
        },
      }),
    startSpan: (event, options) => {
      const correlationId = options?.correlationId ?? createLogId();
      const startedAt = getNow();

      logAtLevel('debug', `${event}.started`, {
        ...options,
        correlationId,
      });

      return {
        correlationId,
        finish: (finishOptions) => {
          return logAtLevel('info', `${event}.finished`, {
            ...finishOptions,
            correlationId,
            durationMs: getNow() - startedAt,
          });
        },
        fail: (error, failOptions) => {
          return logAtLevel('error', `${event}.failed`, {
            ...failOptions,
            correlationId,
            durationMs: getNow() - startedAt,
            error,
          });
        },
      };
    },
  };
};

const devtoolsApi: LoggerDevtoolsApi = {
  clear: () => {
    LOG_BUFFER.length = 0;
  },
  getEntries: () => [...LOG_BUFFER],
  subscribe: (listener) => {
    LOG_LISTENERS.add(listener);

    return () => {
      LOG_LISTENERS.delete(listener);
    };
  },
};

declare global {
  interface Window {
    __APP_LOGGER__?: LoggerDevtoolsApi;
  }
}

if (typeof window !== 'undefined') {
  window.__APP_LOGGER__ = devtoolsApi;
}

/**
 * Creates a scoped {@link LoggerApi} instance.
 *
 * @param config - Logger configuration including scope, default tags, and context.
 * @returns A fully-configured logger bound to the given scope.
 *
 * @example
 * ```ts
 * const logger = createLogger({ scope: 'cart.context', tags: ['cart'] });
 * logger.info('add_item', { context: { productId: 'APL-IP15P' } });
 * ```
 */
export const createLogger = (config: LoggerConfig): LoggerApi => {
  return createLoggerApi(config);
};

/**
 * Registers a listener that is called for every log entry emitted after this
 * call. Useful for piping logs to a UI panel or test spy.
 *
 * @param listener - Callback receiving each {@link LogEntry}.
 * @returns An unsubscribe function — call it to stop receiving entries.
 */
export const subscribeToLogs = (listener: LogListener): (() => void) => {
  return devtoolsApi.subscribe(listener);
};

/**
 * Returns a shallow copy of all entries currently in the in-memory log buffer
 * (up to {@link MAX_BUFFER_SIZE} most recent entries).
 */
export const getLogEntries = (): LogEntry[] => {
  return devtoolsApi.getEntries();
};

/**
 * Empties the in-memory log buffer.
 * Useful in tests to reset state between test cases.
 */
export const clearLogEntries = (): void => {
  devtoolsApi.clear();
};
