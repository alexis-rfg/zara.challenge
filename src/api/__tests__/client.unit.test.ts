import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiClient, ApiError } from '../client';

vi.mock('@/env', () => ({
  env: () => ({ apiKey: 'test-api-key', baseUrl: 'https://api.test' }),
}));

vi.mock('@/utils/logger', () => ({
  createLogger: () => ({
    startSpan: () => ({ finish: vi.fn(), fail: vi.fn() }),
    error: vi.fn(),
    info: vi.fn(),
  }),
}));

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('ApiError', () => {
  it('creates an error with name ApiError', () => {
    const err = new ApiError('Not Found', 404, 'Not Found');
    expect(err.name).toBe('ApiError');
    expect(err.message).toBe('Not Found');
    expect(err.status).toBe(404);
    expect(err.statusText).toBe('Not Found');
    expect(err).toBeInstanceOf(Error);
  });
});

describe('apiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sends x-api-key header with every request', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve({ id: '1' }),
    });

    await apiClient('/endpoint-header-test');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.test/endpoint-header-test',
      expect.objectContaining({
        headers: { 'x-api-key': 'test-api-key' },
      }),
    );
  });

  it('returns parsed JSON on a successful response', async () => {
    const mockData = [{ id: '1', name: 'iPhone' }];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve(mockData),
    });

    const result = await apiClient<typeof mockData>('/endpoint-ok');
    expect(result).toEqual(mockData);
  });

  it('throws ApiError when response is not ok', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: () => Promise.resolve({}),
    });

    await expect(apiClient('/endpoint-404')).rejects.toBeInstanceOf(ApiError);

    try {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({}),
      });
      await apiClient('/endpoint-500-b');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError);
      expect((err as ApiError).status).toBe(500);
      expect((err as ApiError).statusText).toBe('Internal Server Error');
    }
  });

  it('re-throws DOMException AbortError unchanged', async () => {
    const abortError = new DOMException('Aborted', 'AbortError');
    mockFetch.mockRejectedValueOnce(abortError);

    await expect(apiClient('/endpoint-abort')).rejects.toEqual(abortError);
  });

  it('wraps unknown network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network failure'));

    await expect(apiClient('/endpoint-network-err')).rejects.toThrow('Network error:');
  });

  it('caches successful responses and skips fetch on second call', async () => {
    const mockData = { id: 'cached' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve(mockData),
    });

    const result1 = await apiClient('/endpoint-cache-hit');
    const result2 = await apiClient('/endpoint-cache-hit');

    expect(result1).toEqual(mockData);
    expect(result2).toEqual(mockData);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('refetches after cache TTL expires', async () => {
    const mockData = { id: 'stale' };
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve(mockData),
    });

    await apiClient('/endpoint-ttl');
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // Advance past the 5-minute TTL
    vi.advanceTimersByTime(5 * 60 * 1000 + 1);

    await apiClient('/endpoint-ttl');
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('forwards AbortSignal to fetch', async () => {
    const controller = new AbortController();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: () => Promise.resolve({}),
    });

    await apiClient('/endpoint-signal', controller.signal);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ signal: controller.signal }),
    );
  });

  it('wraps non-Error network failures', async () => {
    mockFetch.mockRejectedValueOnce('some string error');

    await expect(apiClient('/endpoint-string-err')).rejects.toThrow('Network error: Unknown error');
  });
});
