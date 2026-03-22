import { useEffect, useMemo } from 'react';
import { useProducts } from '@/hooks/useProducts';
import { useColorFilter } from '@/hooks/useColorFilter';
import { SearchBar } from '@/components/SearchBar/SearchBar';
import { ColorFilter } from '@/components/ColorFilter/ColorFilter';
import { PhoneCard } from '@/components/PhoneCard/PhoneCard';
import './PhoneListPage.scss';

/**
 * Home page — displays the mobile phone catalog.
 *
 * ### Layout
 * - A sticky header containing {@link SearchBar} (desktop / all sizes) and
 *   {@link ColorFilter} (mobile-only).
 * - A CSS Grid of {@link PhoneCard} items.
 *
 * ### Data flow
 * - {@link useProducts} owns the API fetch lifecycle. It exposes `submitSearch`
 *   which `SearchBar` calls on Enter / clear; only then is a network request fired.
 * - {@link useColorFilter} manages a client-side colour filter that is applied
 *   on top of the API results via `filterProducts`.
 * - `displayProducts` is a memoised derived value so the filter is only
 *   re-computed when either `products` or the active colour changes.
 *
 * ### States handled
 * - **Loading** — a thin progress line under the sticky header (no spinner).
 * - **Error** — error banner with a reload button.
 * - **Empty results** — "No products found" message.
 * - **Populated** — CSS Grid of cards.
 */
type PageState = 'loading' | 'error' | 'empty' | 'populated';

const getPageState = (loading: boolean, error: string | null, productCount: number): PageState => {
  if (error) return 'error';
  if (loading) return 'loading';
  if (productCount === 0) return 'empty';
  return 'populated';
};

export const PhoneListPage = () => {
  const { products, loading, error, committedSearch, submitSearch, resultCount } = useProducts();
  const colorFilter = useColorFilter();
  const { filterProducts } = colorFilter;

  const displayProducts = useMemo(() => filterProducts(products), [products, filterProducts]);
  const pageState = getPageState(loading, error, displayProducts.length);

  useEffect(() => {
    document.title = 'Zara Mobile Phones';
  }, []);

  const renderContent = () => {
    switch (pageState) {
      case 'error':
        return (
          <div className="phone-list-page__error" role="alert">
            <h2>Error Loading Products</h2>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Try Again</button>
          </div>
        );

      case 'loading':
        return (
          <div className="phone-list-page__progress-wrapper">
            <div
              className="phone-list-page__progress"
              role="progressbar"
              aria-label="Loading products"
            />
          </div>
        );

      case 'empty':
        return (
          <div className="page-transition">
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
            <div className="phone-list-page__empty" role="status">
              <p>No products found{committedSearch && ` for "${committedSearch}"`}</p>
            </div>
          </div>
        );

      case 'populated':
        return (
          <div className="page-transition">
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
            <div className="phone-list-page__grid-shell">
              <div className="phone-list-page__grid">
                {displayProducts.map((product) => (
                  <PhoneCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="phone-list-page">
      <h1 className="sr-only">Mobile Phones</h1>
      {renderContent()}
    </div>
  );
};
