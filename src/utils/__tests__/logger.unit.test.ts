import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearLogEntries, createLogger, getLogEntries, subscribeToLogs } from '../logger';

describe('logger observer', () => {
  beforeEach(() => {
    clearLogEntries();
    vi.restoreAllMocks();
  });

  it('stores emitted entries and notifies subscribers', () => {
    const logger = createLogger({
      scope: 'products.list',
      tags: ['products'],
    });
    const listener = vi.fn();
    const unsubscribe = subscribeToLogs(listener);

    const entry = logger.info('load_finished', {
      tags: ['success'],
      context: {
        resultCount: 20,
      },
    });

    expect(listener).toHaveBeenCalledWith(entry);
    expect(getLogEntries()).toContainEqual(
      expect.objectContaining({
        scope: 'products.list',
        event: 'load_finished',
        tags: ['products', 'success'],
      }),
    );

    unsubscribe();
  });

  it('inherits parent scope, tags and context in child loggers', () => {
    const rootLogger = createLogger({
      scope: 'api',
      tags: ['http'],
      context: {
        service: 'catalog',
      },
    });
    const childLogger = rootLogger.child({
      scope: 'products',
      tags: ['search'],
      context: {
        endpoint: '/products',
      },
    });

    childLogger.debug('request_started');

    expect(getLogEntries()).toContainEqual(
      expect.objectContaining({
        scope: 'api.products',
        event: 'request_started',
        tags: ['http', 'search'],
        context: {
          service: 'catalog',
          endpoint: '/products',
        },
      }),
    );
  });

  it('captures correlation ids and duration for spans', () => {
    const logger = createLogger({
      scope: 'storage.cart',
    });
    const nowSpy = vi.spyOn(performance, 'now');

    nowSpy.mockReturnValueOnce(100).mockReturnValueOnce(140);

    const span = logger.startSpan('write');
    const entry = span.finish({
      tags: ['save'],
    });

    expect(entry.event).toBe('write.finished');
    expect(entry.correlationId).toBe(span.correlationId);
    expect(entry.durationMs).toBe(40);
  });
});
