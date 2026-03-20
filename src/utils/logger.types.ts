/**
 * Log severity levels.
 * - `debug`: Detailed information for debugging purposes
 * - `info`: General informational messages
 * - `warn`: Warning messages for potentially harmful situations
 * - `error`: Error messages for failure events
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Additional contextual data attached to a log entry.
 * Can contain any key-value pairs with unknown values.
 */
export type LogContext = Record<string, unknown>;

/**
 * Serialized representation of an Error object for logging.
 * Contains the error name, message, and optional stack trace.
 */
export type SerializedError = {
  /** The name of the error (e.g., "TypeError", "Error") */
  name: string;
  /** The error message */
  message: string;
  /** Optional stack trace string */
  stack?: string;
};

/**
 * Complete log entry structure containing all logging metadata.
 * Used for structured logging throughout the application.
 */
export type LogEntry = {
  /** Unique identifier for this log entry */
  id: string;
  /** ISO 8601 timestamp when the log was created */
  timestamp: string;
  /** Severity level of the log */
  level: LogLevel;
  /** Scope or module where the log originated (e.g., "api", "ui") */
  scope: string;
  /** Event name or action being logged */
  event: string;
  /** Array of tags for categorization and filtering */
  tags: string[];
  /** Optional additional context data */
  context?: LogContext;
  /** Optional correlation ID for tracing related logs */
  correlationId?: string;
  /** Optional duration in milliseconds for performance tracking */
  durationMs?: number;
  /** Optional serialized error information */
  error?: SerializedError;
};
