export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogContext = Record<string, unknown>;

export type SerializedError = {
  name: string;
  message: string;
  stack?: string;
};

export type LogEntry = {
  id: string;
  timestamp: string;
  level: LogLevel;
  scope: string;
  event: string;
  tags: string[];
  context?: LogContext;
  correlationId?: string;
  durationMs?: number;
  error?: SerializedError;
};
