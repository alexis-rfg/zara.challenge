// Enables jest-dom matchers for Vitest
import '@testing-library/jest-dom';

/**
 * Suppress React Router v6 future-flag warnings in tests.
 *
 * The production app silences these by passing the `future` flags directly to
 * <BrowserRouter> in App.tsx. Tests cannot do the same because they render
 * components in isolation using <MemoryRouter>, which accepts the same flags
 * but would require adding them to every renderWithRouter helper across the
 * whole test suite. Filtering at the console level here is the single-point
 * equivalent for the test environment.
 */
const originalWarn = console.warn.bind(console);
console.warn = (message?: unknown, ...rest: unknown[]) => {
  if (typeof message === 'string' && message.includes('React Router Future Flag Warning')) return;
  originalWarn(message, ...rest);
};
