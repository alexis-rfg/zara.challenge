import { useEffect, useMemo } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { useColorFilter } from '@/hooks/useColorFilter';
import { SearchBar } from '@/components/SearchBar/SearchBar';
import { ColorFilter } from '@/components/ColorFilter/ColorFilter';
import { PhoneCard } from '@/components/PhoneCard/PhoneCard';
import './PhoneListPage.scss';

export const PhoneListPage = () => {
  const { products, loading, error, committedSearch, submitSearch, resultCount } = useProducts();
  const colorFilter = useColorFilter();
  const { filterProducts } = colorFilter;

  const displayProducts = useMemo(() => filterProducts(products), [products, filterProducts]);

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
          onSearch={submitSearch}
          committedSearch={committedSearch}
          resultCount={resultCount}
          loading={loading}
        />
        <ColorFilter
          resultCount={displayProducts.length}
          loading={loading}
          isOpen={colorFilter.isOpen}
          isFilterLoading={colorFilter.isLoading}
          availableColors={colorFilter.availableColors}
          selectedColor={colorFilter.selectedColor}
          activeCount={colorFilter.activeCount}
          onOpen={colorFilter.open}
          onClose={colorFilter.close}
          onSelect={colorFilter.select}
          onClear={colorFilter.clear}
        />
      </div>

      {loading ? (
        <div className="phone-list-page__loading" aria-live="polite">
          <div className="phone-list-page__spinner" />
          <p>Loading products...</p>
        </div>
      ) : displayProducts.length === 0 ? (
        <div className="phone-list-page__empty" role="status">
          <p>No products found{committedSearch && ` for "${committedSearch}"`}</p>
        </div>
      ) : (
        <div className="phone-list-page__grid-shell">
          <div className="phone-list-page__grid">
            {displayProducts.map((product) => (
              <PhoneCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
