import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { SearchBarProps } from '@/types/components.types';
import './SearchBar.scss';

/**
 * Search form with a results-count indicator.
 *
 * The component keeps `inputValue` as local state so keystrokes do not cause
 * upstream re-renders. A fetch is only triggered when the user presses Enter
 * or clicks the clear button, at which point `onSearch` is called with the
 * trimmed value.
 *
 * The results label is driven by `committedSearch` and `resultCount`, not by
 * the live input value.
 *
 * @param props - Component props.
 * @returns Search form JSX.
 */
export const SearchBar = ({
  onSearch,
  committedSearch,
  resultCount,
  loading,
  disabled = false,
}: SearchBarProps) => {
  const { t } = useTranslation();
  const inputId = useId();
  const [inputValue, setInputValue] = useState('');
  const hasInputValue = inputValue.length > 0;

  /**
   * Returns the status line shown below the search input.
   *
   * @returns Localized search status text.
   */
  const getResultsLabel = (): string => {
    if (loading) {
      return t('searchBar.searching');
    }

    return committedSearch
      ? t('searchBar.resultCountFor', { count: resultCount, term: committedSearch })
      : t('searchBar.resultCount', { count: resultCount });
  };

  /**
   * Submits the current search term to the parent container.
   *
   * @param e - React form submit event.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (disabled) return;
    onSearch(inputValue.trim());
  };

  /** Clears the input and resets the committed search upstream. */
  const handleClear = () => {
    if (disabled) return;
    setInputValue('');
    onSearch('');
  };

  /**
   * Syncs the controlled input value with the user's keystrokes.
   *
   * @param e - React input change event.
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const clearButton = hasInputValue ? (
    <button
      type="button"
      className="search-bar__clear"
      onClick={handleClear}
      disabled={disabled}
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
        focusable="false"
      >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  ) : null;

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
          focusable="false"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>

        <input
          id={inputId}
          name="search"
          type="text"
          className="search-bar__input"
          placeholder={t('searchBar.placeholder')}
          value={inputValue}
          onChange={handleInputChange}
          disabled={disabled}
          aria-label={t('searchBar.ariaLabel')}
        />

        {clearButton}
      </div>

      <div className="search-bar__results" role="status" aria-live="polite" aria-atomic="true">
        <span>{getResultsLabel()}</span>
      </div>
    </form>
  );
};
