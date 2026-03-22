import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useProducts } from '@/hooks/useProducts';
import { useColorFilter } from '@/hooks/useColorFilter';
import { SearchBar } from '@/components/SearchBar/SearchBar';
import { ColorFilter } from '@/components/ColorFilter/ColorFilter';
import { PhoneCard } from '@/components/PhoneCard/PhoneCard';
import type { PhoneListPageState } from '@/types/page.types';
import './PhoneListPage.scss';

/**
 * Resolves the current list-page state from request and data status.
 *
 * @param loading - Whether the product request is still running.
 * @param error - Current error message, if any.
 * @param productCount - Number of products available to render.
 * @returns Derived page state for the main content area.
 */
const getPageState = (
  loading: boolean,
  error: string | null,
  productCount: number,
): PhoneListPageState => {
  if (error) return 'error';
  if (loading) return 'loading';
  if (productCount === 0) return 'empty';
  return 'populated';
};

/**
 * Home page displaying the mobile phone catalog.
 *
 * @returns Phone list page JSX.
 */
export const PhoneListPage = () => {
  const { t } = useTranslation();
  const { products, loading, error, committedSearch, submitSearch, resultCount } = useProducts();
  const colorFilter = useColorFilter();
  const { filterProducts } = colorFilter;

  const displayProducts = useMemo(() => filterProducts(products), [products, filterProducts]);
  const pageState = getPageState(loading, error, displayProducts.length);

  useEffect(() => {
    document.title = t('phoneListPage.title');
  }, [t]);

  /**
   * Renders the correct content block for the current list-page state.
   *
   * @returns JSX for the error, loading, empty, or populated state.
   */
  const renderContent = () => {
    switch (pageState) {
      case 'error':
        return (
          <div className="phone-list-page__error" role="alert">
            <h2>{t('phoneListPage.errorHeading')}</h2>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>{t('phoneListPage.tryAgain')}</button>
          </div>
        );

      case 'loading':
        return (
          <div className="phone-list-page__progress-wrapper">
            <div
              className="phone-list-page__progress"
              role="progressbar"
              aria-label={t('phoneListPage.loadingAriaLabel')}
            />
          </div>
        );

      case 'empty': {
        const emptyStateMessage = committedSearch
          ? t('phoneListPage.noProductsFor', { term: committedSearch })
          : t('phoneListPage.noProducts');

        return (
          <div className="page-transition">
            <div className="phone-list-page__empty" role="status">
              <p>{emptyStateMessage}</p>
            </div>
          </div>
        );
      }

      case 'populated':
        return (
          <div className="page-transition">
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
      <h1 className="sr-only">{t('phoneListPage.heading')}</h1>
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
      {renderContent()}
    </div>
  );
};
