import './SearchBar.scss';

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  resultCount: number;
  loading?: boolean;
};

export const SearchBar = ({ value, onChange, resultCount, loading }: SearchBarProps) => {
  return (
    <div className="search-bar">
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
          placeholder="Search by name or brand..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label="Search products"
        />
      </div>
      <div className="search-bar__results" role="status" aria-live="polite" aria-atomic="true">
        {loading ? (
          <span>Searching...</span>
        ) : (
          <span>
            {resultCount} {resultCount === 1 ? 'result' : 'results'}
            {value && ` for "${value}"`}
          </span>
        )}
      </div>
    </div>
  );
};
