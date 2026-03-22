import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import { LazyImage } from '@/components/LazyImage/LazyImage';
import './CartPage.scss';

/**
 * Shopping cart page — rendered at `/cart`.
 *
 * ### Sections
 * - **Header** — "Cart (N)" heading.
 * - **Item list** — each item shows its colour-specific image, name, selected specs
 *   (storage + colour), price, and a delete button.
 * - **Footer** — total price summary, "Continuar comprando" button (→ `/`), and a
 *   placeholder "Pay" button.
 *
 * ### Empty state
 * When the cart has no items the item list is replaced by a visually-hidden
 * `role="status"` message ("Tu carrito está vacío"), and the footer only shows
 * the "Continuar comprando" button.
 *
 * Each item is keyed by `id + colorName + storageCapacity + index` to allow
 * duplicate configurations (same phone, different storage or colour) as separate
 * line items while still giving React a stable key.
 */
export const CartPage = () => {
  const navigate = useNavigate();
  const { items, removeItem, totalItems, totalPrice } = useCart();
  const hasItems = items.length > 0;

  useEffect(() => {
    document.title = 'Cart - MBST';
    return () => {
      document.title = 'MBST';
    };
  }, []);

  const formattedTotal = new Intl.NumberFormat('es-ES', {
    style: 'decimal',
    minimumFractionDigits: 0,
  }).format(totalPrice);

  return (
    <section className="cart-page" aria-label="Shopping cart">
      <div className="cart-page__content">
        <h1 className="cart-page__heading">Cart ({totalItems})</h1>

        {!hasItems ? (
          <p className="cart-page__empty sr-only" role="status">
            Tu carrito está vacío
          </p>
        ) : (
          <ul className="cart-page__list" aria-label="Cart items">
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
                    aria-label={`Eliminar ${item.name} del carrito`}
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={`cart-page__footer${hasItems ? '' : ' cart-page__footer--empty'}`}>
        {hasItems && (
          <div className="cart-page__summary">
            <div className="cart-page__total-group">
              <span className="cart-page__total-label">Total</span>
              <span className="cart-page__total-price">{formattedTotal} EUR</span>
            </div>
          </div>
        )}

        <button className="cart-page__continue" onClick={() => navigate('/')}>
          Continuar comprando
        </button>

        {hasItems && (
          <button className="cart-page__pay" aria-label="Proceder al pago">
            Pay
          </button>
        )}
      </div>
    </section>
  );
};
