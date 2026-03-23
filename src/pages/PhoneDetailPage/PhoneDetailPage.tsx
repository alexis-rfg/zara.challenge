import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProductDetail } from '@/hooks/useProductDetail';
import { useCart } from '@/hooks/useCart';
import { useScopedLogger } from '@/hooks/useScopedLogger';
import { LazyImage } from '@/components/LazyImage/LazyImage';
import { ColorSelector } from '@/components/ColorSelector/ColorSelector';
import { StorageSelector } from '@/components/StorageSelector/StorageSelector';
import { SimilarProducts } from '@/components/SimilarProducts/SimilarProducts';
import type { ColorOption, ProductDetail, StorageOption } from '@/types/product.types';
import type { ProductRouteParams } from '@/types/page.types';
import './PhoneDetailPage.scss';

const PHONE_DETAIL_LOGGER_TAGS = ['products', 'detail', 'ui'] as const;

/**
 * Top-level product attributes rendered in the specifications table
 * before the technical spec rows. Keys map directly to {@link ProductDetail} fields.
 */
const SPEC_ROWS = [
  { key: 'brand' as const },
  { key: 'name' as const },
  { key: 'description' as const },
] as const;

/**
 * Technical specification rows rendered in the specifications table.
 * Keys map to {@link ProductDetail.specs} fields. The order here determines
 * the display order in the UI.
 */
const TECH_SPEC_ROWS = [
  { key: 'screen' as const },
  { key: 'resolution' as const },
  { key: 'processor' as const },
  { key: 'mainCamera' as const },
  { key: 'selfieCamera' as const },
  { key: 'battery' as const },
  { key: 'os' as const },
  { key: 'screenRefreshRate' as const },
] as const;

/**
 * Resolves the currently active color option for the detail hero.
 *
 * @param product - Product detail record.
 * @param selectedColorIndex - Selected color index, if any.
 * @returns Active color option or the first available option as fallback.
 */
const getSelectedColorOption = (
  product: ProductDetail,
  selectedColorIndex: number | null,
): ColorOption | undefined => {
  if (selectedColorIndex === null) {
    return product.colorOptions[0];
  }

  return product.colorOptions[selectedColorIndex] ?? product.colorOptions[0];
};

/**
 * Resolves the currently active storage option for the detail hero.
 *
 * @param product - Product detail record.
 * @param selectedStorageIndex - Selected storage index, if any.
 * @returns Active storage option or undefined when nothing has been selected yet.
 */
const getSelectedStorageOption = (
  product: ProductDetail,
  selectedStorageIndex: number | null,
): StorageOption | undefined => {
  if (selectedStorageIndex === null) {
    return undefined;
  }

  return product.storageOptions[selectedStorageIndex];
};

/**
 * Formats a product price using the EUR code style shown in the design.
 *
 * @param price - Numeric price value.
 * @returns Formatted price string like `899 EUR`.
 */
const formatDetailPrice = (price: number): string => {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    currencyDisplay: 'code',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

/**
 * Product detail page rendered at `/products/:id`.
 *
 * @returns Product detail view.
 */
export const PhoneDetailPage = () => {
  const { t } = useTranslation();
  const { id } = useParams<ProductRouteParams>();
  const navigate = useNavigate();
  const { product, loading, error } = useProductDetail(id);
  const { addItem } = useCart();
  const phoneDetailLogger = useScopedLogger('phone-detail.page', PHONE_DETAIL_LOGGER_TAGS);

  const [selectedColorIndex, setSelectedColorIndex] = useState<number | null>(null);
  const [selectedStorageIndex, setSelectedStorageIndex] = useState<number | null>(null);

  /**
   * Selects a color by index and auto-defaults storage to `0` if not yet chosen.
   *
   * @param index - Selected color index.
   */
  const handleColorSelect = (index: number) => {
    phoneDetailLogger.debug('select_color', {
      tags: ['interaction'],
      context: {
        productId: id,
        selectedColorIndex: index,
      },
    });

    setSelectedColorIndex(index);
    if (selectedStorageIndex === null) {
      setSelectedStorageIndex(0);
    }
  };

  /**
   * Selects a storage tier by index and auto-defaults color to `0` if not yet chosen.
   *
   * @param index - Selected storage index.
   */
  const handleStorageSelect = (index: number) => {
    phoneDetailLogger.debug('select_storage', {
      tags: ['interaction'],
      context: {
        productId: id,
        selectedStorageIndex: index,
      },
    });

    setSelectedStorageIndex(index);
    if (selectedColorIndex === null) {
      setSelectedColorIndex(0);
    }
  };

  useEffect(() => {
    if (product) {
      phoneDetailLogger.info('view_product', {
        tags: ['page-view'],
        context: {
          productId: product.id,
          brand: product.brand,
          name: product.name,
        },
      });

      document.title = `${product.brand} ${product.name} - MBST`;
    }

    return () => {
      document.title = 'MBST';
    };
  }, [phoneDetailLogger, product]);

  /** Resets variant selections when the route changes to another product. */
  useEffect(() => {
    setSelectedColorIndex(null);
    setSelectedStorageIndex(null);
  }, [id]);

  if (loading) {
    return (
      <div
        className="phone-detail-page__loading"
        aria-live="polite"
        aria-label={t('phoneDetailPage.loadingAriaLabel')}
      >
        <div className="phone-detail-page__spinner" role="status" />
        <p>{t('phoneDetailPage.loading')}</p>
      </div>
    );
  }

  if (error || !product) {
    const errorMessage = error ?? t('phoneDetailPage.notFoundMessage');

    return (
      <div className="phone-detail-page__error" role="alert">
        <h2>{t('phoneDetailPage.notFoundHeading')}</h2>
        <p>{errorMessage}</p>
        <button onClick={() => navigate('/')}>{t('phoneDetailPage.backToHome')}</button>
      </div>
    );
  }

  const canAddToCart = selectedColorIndex !== null && selectedStorageIndex !== null;
  const selectedColor = getSelectedColorOption(product, selectedColorIndex);
  const selectedStorage = getSelectedStorageOption(product, selectedStorageIndex);
  const currentImageUrl = selectedColor?.imageUrl ?? '';
  const currentPrice = selectedStorage?.price ?? product.basePrice;
  const formattedPrice = formatDetailPrice(currentPrice);

  const specificationRows = SPEC_ROWS.map(({ key }) => (
    <div key={key} className="phone-detail-page__spec-row">
      <dt className="phone-detail-page__spec-label">{t(`phoneDetailPage.specs.${key}`)}</dt>
      <dd className="phone-detail-page__spec-value">{product[key]}</dd>
    </div>
  ));

  const technicalSpecificationRows = TECH_SPEC_ROWS.map(({ key }) => (
    <div key={key} className="phone-detail-page__spec-row">
      <dt className="phone-detail-page__spec-label">{t(`phoneDetailPage.specs.${key}`)}</dt>
      <dd className="phone-detail-page__spec-value">{product.specs[key]}</dd>
    </div>
  ));

  /**
   * Adds the selected configured variant to the cart and redirects to `/cart`.
   */
  const handleAddToCart = () => {
    if (!canAddToCart || !selectedColor || !selectedStorage) {
      phoneDetailLogger.warn('add_to_cart_blocked', {
        tags: ['interaction'],
        context: {
          productId: product.id,
          canAddToCart,
          hasSelectedColor: Boolean(selectedColor),
          hasSelectedStorage: Boolean(selectedStorage),
        },
      });
      return;
    }

    phoneDetailLogger.info('add_to_cart', {
      tags: ['interaction', 'cart'],
      context: {
        productId: product.id,
        colorName: selectedColor.name,
        storageCapacity: selectedStorage.capacity,
        price: selectedStorage.price,
      },
    });

    addItem({
      id: product.id,
      name: product.name,
      brand: product.brand,
      imageUrl: selectedColor.imageUrl,
      colorName: selectedColor.name,
      storageCapacity: selectedStorage.capacity,
      price: selectedStorage.price,
    });

    navigate('/cart');
  };

  return (
    <article className="phone-detail-page">
      <section className="phone-detail-page__hero" aria-label={t('phoneDetailPage.heroAriaLabel')}>
        <div className="phone-detail-page__image-wrapper">
          <LazyImage
            eager
            src={currentImageUrl}
            alt={`${product.brand} ${product.name}`}
            className="phone-detail-page__image"
            width={640}
            height={640}
            sizes="(max-width: 768px) 100vw, 40vw"
          />
        </div>

        <div className="phone-detail-page__product-info">
          <div className="phone-detail-page__title-price">
            <h1 className="phone-detail-page__title">{product.name}</h1>
            <p className="phone-detail-page__price">
              {t('phoneDetailPage.priceFrom', { price: formattedPrice })}
            </p>
          </div>

          <div className="phone-detail-page__selectors">
            <StorageSelector
              options={product.storageOptions}
              selectedIndex={selectedStorageIndex}
              onSelect={handleStorageSelect}
            />
            <ColorSelector
              colors={product.colorOptions}
              selectedIndex={selectedColorIndex}
              onSelect={handleColorSelect}
            />
          </div>

          <button
            className="phone-detail-page__add-btn"
            onClick={handleAddToCart}
            disabled={!canAddToCart}
            aria-disabled={!canAddToCart}
          >
            {t('phoneDetailPage.addToCart')}
          </button>
        </div>
      </section>

      <section
        className="phone-detail-page__specs"
        aria-label={t('phoneDetailPage.specsAriaLabel')}
      >
        <h2 className="phone-detail-page__specs-heading">{t('phoneDetailPage.specsHeading')}</h2>
        <dl className="phone-detail-page__specs-list">
          {specificationRows}
          {technicalSpecificationRows}
        </dl>
      </section>

      <SimilarProducts products={product.similarProducts} />
    </article>
  );
};
