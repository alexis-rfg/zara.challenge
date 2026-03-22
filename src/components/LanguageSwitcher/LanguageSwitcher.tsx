import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.scss';

const LANGUAGES = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'es', label: 'ES', name: 'Español' },
] as const;

type LangCode = (typeof LANGUAGES)[number]['code'];

/**
 * Globe-icon dropdown for switching the UI language between English and Spanish.
 *
 * Uses `i18n.changeLanguage()` from `react-i18next` — no extra provider needed
 * because `initReactI18next` already injects one under the hood.
 * `i18next-browser-languagedetector` persists the chosen language to localStorage
 * automatically whenever `changeLanguage` is called.
 */
export const LanguageSwitcher = () => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalise "en-US" → "en"
  const currentLang = (i18n.language?.slice(0, 2) ?? 'en') as LangCode;

  const close = useCallback(() => setIsOpen(false), []);

  // Close on outside click
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [close]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen, close]);

  const handleSelect = (code: string) => {
    void i18n.changeLanguage(code);
    close();
  };

  return (
    <div className="lang-switcher" ref={containerRef}>
      <button
        type="button"
        className="lang-switcher__toggle"
        onClick={() => setIsOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={t('nav.languageToggleLabel', { lang: currentLang.toUpperCase() })}
      >
        {/* Globe icon */}
        <svg
          className="lang-switcher__icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span className="lang-switcher__current" aria-hidden="true">
          {currentLang.toUpperCase()}
        </span>
      </button>

      {isOpen && (
        <ul className="lang-switcher__dropdown" role="listbox" aria-label={t('nav.selectLanguage')}>
          {LANGUAGES.map(({ code, label, name }) => (
            <li key={code} role="option" aria-selected={currentLang === code}>
              <button
                type="button"
                className={`lang-switcher__option${currentLang === code ? ' lang-switcher__option--active' : ''}`}
                onClick={() => handleSelect(code)}
              >
                <span className="lang-switcher__option-label">{label}</span>
                <span className="lang-switcher__option-name">{name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
