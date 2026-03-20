import { useState, useEffect } from 'react';

/**
 * Custom hook that debounces a value by delaying updates until after a specified delay.
 *
 * Useful for optimizing performance in scenarios like search inputs, where you want to
 * wait for the user to stop typing before triggering an expensive operation (e.g., API call).
 *
 * @template T - The type of the value to debounce
 * @param value - The value to debounce
 * @param delay - The delay in milliseconds before updating the debounced value
 * @returns The debounced value
 *
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearch = useDebounce(searchTerm, 400);
 *
 * useEffect(() => {
 *   // This will only run 400ms after the user stops typing
 *   fetchResults(debouncedSearch);
 * }, [debouncedSearch]);
 * ```
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};
