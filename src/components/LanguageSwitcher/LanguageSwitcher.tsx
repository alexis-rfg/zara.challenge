import { useState, useRef, useEffect, useCallback, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { useScopedLogger } from '@/hooks/useScopedLogger';
import type { LanguageCode, LanguageOption } from '@/types/i18n.types';
import './LanguageSwitcher.scss';

const LANGUAGES: readonly LanguageOption[] = [
  { code: 'en', label: 'EN', name: 'English' },
  { code: 'es', label: 'ES', name: 'Español' },
] as const;

const LANGUAGE_LOGGER_TAGS = ['ui', 'i18n'] as const;

/**
 * Globe-icon dropdown for switching the UI language between English and Spanish.
 *
 * @returns Language switcher JSX.
 */
export const LanguageSwitcher = () => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownId = useId();
  const languageLogger = useScopedLogger('ui.language-switcher', LANGUAGE_LOGGER_TAGS);

  const currentLang = (i18n.language?.slice(0, 2) ?? 'en') as LanguageCode;

  /** Closes the language dropdown. */
  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    /**
     * Closes the dropdown when the user clicks outside the component.
     *
     * @param event - Native pointer event.
     */
    const handlePointerDown = (event: PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        close();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, [close]);

  useEffect(() => {
    if (!isOpen) return;

    /**
     * Closes the dropdown when the user presses Escape.
     *
     * @param event - Native keyboard event.
     */
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, close]);

  /**
   * Changes the active language and closes the dropdown.
   *
   * @param code - Two-letter language code to activate.
   */
  const handleSelect = (code: LanguageCode) => {
    languageLogger.info('change_language', {
      tags: ['interaction'],
      context: {
        previousLanguage: currentLang,
        nextLanguage: code,
      },
    });

    void i18n.changeLanguage(code);
    close();
  };

  /** Toggles the language dropdown open state. */
  const handleToggle = () => {
    const nextIsOpen = !isOpen;

    languageLogger.debug('toggle_dropdown', {
      tags: ['interaction'],
      context: {
        nextIsOpen,
      },
    });

    setIsOpen(nextIsOpen);
  };

  /**
   * Returns the CSS class for a language option based on selection state.
   *
   * @param code - Language code for the option.
   * @returns Option class name with active modifier when selected.
   */
  const getOptionClassName = (code: LanguageCode): string => {
    return `lang-switcher__option${currentLang === code ? ' lang-switcher__option--active' : ''}`;
  };

  const dropdown = isOpen ? (
    <ul
      id={dropdownId}
      className="lang-switcher__dropdown"
      role="listbox"
      aria-label={t('nav.selectLanguage')}
    >
      {LANGUAGES.map(({ code, label, name }) => (
        <li key={code} role="option" aria-selected={currentLang === code}>
          <button
            type="button"
            className={getOptionClassName(code)}
            onClick={() => handleSelect(code)}
          >
            <span className="lang-switcher__option-label">{label}</span>
            <span className="lang-switcher__option-name">{name}</span>
          </button>
        </li>
      ))}
    </ul>
  ) : null;

  return (
    <div className="lang-switcher" ref={containerRef}>
      <button
        type="button"
        className="lang-switcher__toggle"
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-controls={isOpen ? dropdownId : undefined}
        aria-expanded={isOpen}
        aria-label={t('nav.languageToggleLabel', { lang: currentLang.toUpperCase() })}
      >
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
          focusable="false"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span className="lang-switcher__current" aria-hidden="true">
          {currentLang.toUpperCase()}
        </span>
      </button>

      {dropdown}
    </div>
  );
};
