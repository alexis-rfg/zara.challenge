// Enables jest-dom matchers for Vitest
import '@testing-library/jest-dom';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '@/i18n/locales/en.json';

/**
 * Initialize i18next synchronously for the test environment so that
 * components using `useTranslation()` render with real English strings
 * rather than falling back to key names.
 */
void i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: { en: { translation: en } },
  interpolation: { escapeValue: false },
});

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
