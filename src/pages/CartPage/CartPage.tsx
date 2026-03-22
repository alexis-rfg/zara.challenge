import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '@/hooks/useCart';
import { useScopedLogger } from '@/hooks/useScopedLogger';
import { LazyImage } from '@/components/LazyImage/LazyImage';
import './CartPage.scss';

const CART_PAGE_LOGGER_TAGS = ['cart', 'page'] as const;

/**
 * Shopping cart page rendered at `/cart`.
 *
 * @returns Cart page JSX.
 */
export const CartPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { items, removeItem, totalItems, totalPrice } = useCart();
  const cartPageLogger = useScopedLogger('cart.page', CART_PAGE_LOGGER_TAGS);
  const hasItems = items.length > 0;

  useEffect(() => {
    document.title = t('cartPage.title');
    return () => {
      document.title = 'MBST';
    };
  }, [t]);

  const formattedTotal = new Intl.NumberFormat('es-ES', {
    style: 'decimal',
    minimumFractionDigits: 0,
  }).format(totalPrice);

  /** Navigates the user back to the catalog page. */
  const handleContinueShopping = () => {
    cartPageLogger.info('continue_shopping', {
      tags: ['interaction'],
      context: {
        itemCount: items.length,
      },
    });

    navigate('/');
  };

  const emptyState = hasItems ? null : (
    <p className="cart-page__empty sr-only" role="status">
      {t('cartPage.emptyMessage')}
    </p>
  );

  const cartItemsList = hasItems ? (
    <ul className="cart-page__list" aria-label={t('cartPage.cartItemsAriaLabel')}>
      {items.map((item, index) => (
        <li
          key={`${item.id}-${item.colorName}-${item.storageCapacity}-${index}`}
          className="cart-page__item"
        >
          <div className="cart-page__item-image-wrapper">
            <LazyImage
              src={item.imageUrl}
              alt={`${item.brand} ${item.name}`}
              className="cart-page__item-image"
            />
          </div>
          <div className="cart-page__item-info-delete">
            <div className="cart-page__item-info">
              <div className="cart-page__item-name-group">
                <p className="cart-page__item-name">{item.name}</p>
                <p className="cart-page__item-specs">
                  {item.storageCapacity} | {item.colorName}
                </p>
              </div>
              <p className="cart-page__item-price">{item.price} EUR</p>
            </div>
            <button
              className="cart-page__item-remove"
              onClick={() => removeItem(item.id, item.colorName, item.storageCapacity)}
              aria-label={t('cartPage.removeAriaLabel', { name: item.name })}
            >
              {t('cartPage.removeBtn')}
            </button>
          </div>
        </li>
      ))}
    </ul>
  ) : null;

  const summary = hasItems ? (
    <div className="cart-page__summary">
      <div className="cart-page__total-group">
        <span className="cart-page__total-label">{t('cartPage.totalLabel')}</span>
        <span className="cart-page__total-price">{formattedTotal} EUR</span>
      </div>
    </div>
  ) : null;

  const payButton = hasItems ? (
    <button className="cart-page__pay" aria-label={t('cartPage.payAriaLabel')}>
      {t('cartPage.payBtn')}
    </button>
  ) : null;

  const footerClassName = `cart-page__footer${hasItems ? '' : ' cart-page__footer--empty'}`;

  return (
    <section className="cart-page" aria-label={t('cartPage.cartAriaLabel')}>
      <div className="cart-page__content">
        <h1 className="cart-page__heading">{t('cartPage.heading', { count: totalItems })}</h1>
        {emptyState}
        {cartItemsList}
      </div>

      <div className={footerClassName}>
        {summary}
        <button className="cart-page__continue" onClick={handleContinueShopping}>
          {t('cartPage.continueBtn')}
        </button>
        {payButton}
      </div>
    </section>
  );
};
