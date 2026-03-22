import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import './SearchBar.scss';

/** Props for the {@link SearchBar} component. */
type SearchBarProps = {
  /** Called when the user submits via Enter or clears the input with the ✕ button. */
  onSearch: (term: string) => void;
  /** The term currently active in the API / driving the displayed results. Used to render the results label (e.g. `3 results for "iphone"`). */
  committedSearch: string;
  /** Number of products in the current result set, displayed inside the search bar. */
  resultCount: number;
  /** When `true`, shows a "Searching…" status message instead of the result count. */
  loading?: boolean;
};

/**
 * Search form with a results-count indicator.
 *
 * The component keeps `inputValue` as local state so keystrokes do not cause
 * upstream re-renders. A fetch is only triggered when the user presses **Enter**
 * (form submit) or clicks the **✕** clear button, at which point `onSearch` is
 * called with the trimmed (or empty) value.
 *
 * The results label is driven by `committedSearch` and `resultCount` — the
 * values that reflect what is currently shown in the grid — not the live input.
 *
 * @param props - Component props.
 */
export const SearchBar = ({ onSearch, committedSearch, resultCount, loading }: SearchBarProps) => {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(inputValue.trim());
  };

  const handleClear = () => {
    setInputValue('');
    onSearch('');
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit} role="search">
      <div className="search-bar__input-wrapper">
        <svg
          className="search-bar__icon"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>

        <input
          type="text"
          className="search-bar__input"
          placeholder={t('searchBar.placeholder')}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          aria-label={t('searchBar.ariaLabel')}
        />

        {inputValue && (
          <button
            type="button"
            className="search-bar__clear"
            onClick={handleClear}
            aria-label={t('searchBar.clearAriaLabel')}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </div>

      <div className="search-bar__results" role="status" aria-live="polite" aria-atomic="true">
        {loading ? (
          <span>{t('searchBar.searching')}</span>
        ) : (
          <span>
            {committedSearch
              ? t('searchBar.resultCountFor', { count: resultCount, term: committedSearch })
              : t('searchBar.resultCount', { count: resultCount })}
          </span>
        )}
      </div>
    </form>
  );
};
