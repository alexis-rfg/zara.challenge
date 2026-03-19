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

type LogListener = (entry: LogEntry) => void;

type LogEventOptions = {
  tags?: string[];
  context?: LogContext;
  correlationId?: string;
  durationMs?: number;
  error?: unknown;
};

type LoggerConfig = {
  scope: string;
  tags?: string[];
  context?: LogContext;
};

type SpanCloseOptions = Omit<LogEventOptions, 'correlationId' | 'durationMs'>;

type LoggerApi = {
  debug: (event: string, options?: LogEventOptions) => LogEntry;
  info: (event: string, options?: LogEventOptions) => LogEntry;
  warn: (event: string, options?: LogEventOptions) => LogEntry;
  error: (event: string, options?: LogEventOptions) => LogEntry;
  child: (config: Omit<LoggerConfig, 'context'> & { context?: LogContext }) => LoggerApi;
  startSpan: (
    event: string,
    options?: Omit<LogEventOptions, 'durationMs'>,
  ) => {
    correlationId: string;
    finish: (options?: SpanCloseOptions) => LogEntry;
    fail: (error: unknown, options?: SpanCloseOptions) => LogEntry;
  };
};

type LoggerDevtoolsApi = {
  clear: () => void;
  getEntries: () => LogEntry[];
  subscribe: (listener: LogListener) => () => void;
};

const MAX_BUFFER_SIZE = 200;
const LOG_BUFFER: LogEntry[] = [];
const LOG_LISTENERS = new Set<LogListener>();
const consoleApi = globalThis.console;

let logSequence = 0;

const getNow = (): number => {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
};

const createLogId = (): string => {
  logSequence += 1;

  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `log-${Date.now()}-${logSequence}`;
};

const serializeError = (error: unknown): SerializedError | undefined => {
  if (!error) {
    return undefined;
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
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

const mergeTags = (...tagSets: Array<string[] | undefined>): string[] => {
  return [...new Set(tagSets.flatMap((tags) => tags ?? []).filter(Boolean))];
};

const shouldMirrorToConsole = (): boolean => {
  return import.meta.env.DEV && import.meta.env.MODE !== 'test';
};

const getConsoleMethod = (level: LogLevel): 'log' | 'info' | 'warn' | 'error' => {
  if (level === 'debug') {
    return 'log';
  }

  return level;
};

const mirrorEntryToConsole = (entry: LogEntry): void => {
  if (!shouldMirrorToConsole()) {
    return;
  }

  const method = getConsoleMethod(entry.level);
  const tagLabel = entry.tags.length > 0 ? ` tags=${entry.tags.join(',')}` : '';
  const durationLabel =
    typeof entry.durationMs === 'number' ? ` duration=${entry.durationMs.toFixed(1)}ms` : '';

  consoleApi[method](
    `[${entry.level.toUpperCase()}] [${entry.scope}] ${entry.event}${tagLabel}${durationLabel}`,
    {
      correlationId: entry.correlationId,
      context: entry.context,
      error: entry.error,
      timestamp: entry.timestamp,
    },
  );
};

const emitLog = (entry: LogEntry): LogEntry => {
  LOG_BUFFER.push(entry);

  if (LOG_BUFFER.length > MAX_BUFFER_SIZE) {
    LOG_BUFFER.shift();
  }

  LOG_LISTENERS.forEach((listener) => {
    listener(entry);
  });

  mirrorEntryToConsole(entry);

  return entry;
};

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

  return {
    id: createLogId(),
    timestamp: new Date().toISOString(),
    level,
    scope: config.scope,
    event,
    tags: mergeTags(config.tags, options?.tags),
    context: mergedContext,
    correlationId: options?.correlationId,
    durationMs: options?.durationMs,
    error: serializeError(options?.error),
  };
};

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

export const createLogger = (config: LoggerConfig): LoggerApi => {
  return createLoggerApi(config);
};

export const subscribeToLogs = (listener: LogListener): (() => void) => {
  return devtoolsApi.subscribe(listener);
};

export const getLogEntries = (): LogEntry[] => {
  return devtoolsApi.getEntries();
};

export const clearLogEntries = (): void => {
  devtoolsApi.clear();
};
