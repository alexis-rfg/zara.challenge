import { useEffect } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { SearchBar } from '@/components/SearchBar/SearchBar';
import { PhoneCard } from '@/components/PhoneCard/PhoneCard';
import './PhoneListPage.scss';

export const PhoneListPage = () => {
  const { products, loading, error, searchTerm, setSearchTerm, resultCount } = useProducts();

  useEffect(() => {
    document.title = 'Zara Mobile Phones';
  }, []);

  if (error) {
    return (
      <div className="phone-list-page__error" role="alert">
        <h2>Error Loading Products</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  return (
    <div className="phone-list-page">
      <h1 className="sr-only">Mobile Phones</h1>

      <div className="phone-list-page__sticky-header">
        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          resultCount={resultCount}
          loading={loading}
        />
      </div>

      {loading ? (
        <div className="phone-list-page__loading" aria-live="polite">
          <div className="phone-list-page__spinner" />
          <p>Loading products...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="phone-list-page__empty" role="status">
          <p>No products found{searchTerm && ` for "${searchTerm}"`}</p>
        </div>
      ) : (
        <div className="phone-list-page__grid-shell">
          <div className="phone-list-page__grid">
            {products.map((product) => (
              <PhoneCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
