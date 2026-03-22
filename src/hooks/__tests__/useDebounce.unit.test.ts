import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 300));
    expect(result.current).toBe('initial');
  });

  it('does not update before the delay elapses', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'first' },
    });

    rerender({ value: 'second' });
    vi.advanceTimersByTime(299);

    expect(result.current).toBe('first');
  });

  it('updates after the delay elapses', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'first' },
    });

    rerender({ value: 'second' });

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(result.current).toBe('second');
  });

  it('resets the timer when value changes before delay', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'first' },
    });

    rerender({ value: 'second' });
    vi.advanceTimersByTime(200);

    rerender({ value: 'third' });
    vi.advanceTimersByTime(200);

    // Only 200ms since last change — should still be 'first'
    expect(result.current).toBe('first');

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(result.current).toBe('third');
  });

  it('works with numeric values', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: 0 },
    });

    rerender({ value: 42 });

    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current).toBe(42);
  });

  it('clears timer on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    const { unmount } = renderHook(() => useDebounce('value', 300));

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });
});
