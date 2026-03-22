/**
 * Log severity levels.
 * - `debug`: Detailed diagnostic information.
 * - `info`: General operational messages.
 * - `warn`: Recoverable situations worth highlighting.
 * - `error`: Failures and unexpected behaviour.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/** Structured metadata attached to a log entry. */
export type LogContext = Record<string, unknown>;

/** Serialized representation of an unknown error for safe logging. */
export type SerializedError = {
  /** Error constructor name, when available. */
  name: string;
  /** Human-readable error message. */
  message: string;
  /** Optional stack trace captured from the original error. */
  stack?: string;
};

/** Complete structured log record emitted by the observability layer. */
export type LogEntry = {
  /** Unique identifier for the entry. */
  id: string;
  /** ISO timestamp when the entry was created. */
  timestamp: string;
  /** Severity level of the entry. */
  level: LogLevel;
  /** Logger scope that emitted the entry. */
  scope: string;
  /** Event name for filtering and diagnostics. */
  event: string;
  /** List of tags attached to the entry. */
  tags: string[];
  /** Optional structured context. */
  context?: LogContext;
  /** Correlation identifier for related entries and spans. */
  correlationId?: string;
  /** Measured duration in milliseconds for timed spans. */
  durationMs?: number;
  /** Optional serialized error payload. */
  error?: SerializedError;
};

/** Listener notified for each emitted log entry. */
export type LogListener = (entry: LogEntry) => void;

/** Per-call options accepted by logger methods and timed spans. */
export type LogEventOptions = {
  /** Additional tags merged with the logger defaults. */
  tags?: string[];
  /** Structured context merged with the logger defaults. */
  context?: LogContext;
  /** Correlation ID linking related log entries. */
  correlationId?: string;
  /** Duration in milliseconds, usually set automatically by spans. */
  durationMs?: number;
  /** Unknown thrown value to serialize into the entry. */
  error?: unknown;
};

/** Static configuration for a scoped logger instance. */
export type LoggerConfig = {
  /** Dot-separated module scope, for example `api.client`. */
  scope: string;
  /** Default tags emitted with every entry. */
  tags?: string[];
  /** Default context emitted with every entry. */
  context?: LogContext;
};

/** Close options accepted by span `finish` and `fail` methods. */
export type SpanCloseOptions = Omit<LogEventOptions, 'correlationId' | 'durationMs'>;

/** Timed span handle returned by `logger.startSpan`. */
export type LoggerSpan = {
  /** Correlation ID shared by the span lifecycle entries. */
  correlationId: string;
  /** Finishes the span successfully and emits a completion entry. */
  finish: (options?: SpanCloseOptions) => LogEntry;
  /** Fails the span and emits an error entry. */
  fail: (error: unknown, options?: SpanCloseOptions) => LogEntry;
};

/** Public logger interface exposed by the observability layer. */
export type LoggerApi = {
  debug: (event: string, options?: LogEventOptions) => LogEntry;
  info: (event: string, options?: LogEventOptions) => LogEntry;
  warn: (event: string, options?: LogEventOptions) => LogEntry;
  error: (event: string, options?: LogEventOptions) => LogEntry;
  /** Creates a child logger inheriting tags and context from its parent. */
  child: (config: Omit<LoggerConfig, 'context'> & { context?: LogContext }) => LoggerApi;
  /** Starts a timed span for a multi-step operation. */
  startSpan: (event: string, options?: Omit<LogEventOptions, 'durationMs'>) => LoggerSpan;
};

/** Browser devtools facade exposed on `window.__APP_LOGGER__`. */
export type LoggerDevtoolsApi = {
  /** Clears the in-memory log buffer. */
  clear: () => void;
  /** Returns a shallow copy of current log entries. */
  getEntries: () => LogEntry[];
  /** Subscribes to future log entries. */
  subscribe: (listener: LogListener) => () => void;
};

declare global {
  interface Window {
    __APP_LOGGER__?: LoggerDevtoolsApi;
  }
}
