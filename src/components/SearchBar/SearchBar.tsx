import { useState } from 'react';
import './SearchBar.scss';

type SearchBarProps = {
  /** Called when the user submits (Enter) or clears the search */
  onSearch: (term: string) => void;
  /** The term that is currently active in the API / results (used for the results label) */
  committedSearch: string;
  resultCount: number;
  loading?: boolean;
};

export const SearchBar = ({ onSearch, committedSearch, resultCount, loading }: SearchBarProps) => {
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
          placeholder="Search for a smartphone..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          aria-label="Search products"
        />

        {inputValue && (
          <button
            type="button"
            className="search-bar__clear"
            onClick={handleClear}
            aria-label="Clear search"
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
          <span>Searching...</span>
        ) : (
          <span>
            {resultCount} {resultCount === 1 ? 'result' : 'results'}
            {committedSearch && ` for "${committedSearch}"`}
          </span>
        )}
      </div>
    </form>
  );
};
