import { useMemo } from 'react';
import { createLogger } from '@/utils/logger';
import type { LogContext, LoggerApi } from '@/types/logger.types';

/**
 * Returns a memoized scoped logger for React components and hooks.
 *
 * Keep `tags` and `context` stable when possible so the logger instance does
 * not need to be recreated on every render.
 *
 * @param scope - Dot-separated logger scope.
 * @param tags - Optional default tags attached to every log entry.
 * @param context - Optional default context merged into every log entry.
 * @returns Stable logger API for the provided scope.
 */
export const useScopedLogger = (
  scope: string,
  tags?: readonly string[],
  context?: LogContext,
): LoggerApi => {
  return useMemo(
    () =>
      createLogger({
        scope,
        ...(tags?.length ? { tags: [...tags] } : {}),
        ...(context ? { context } : {}),
      }),
    [scope, tags, context],
  );
};
