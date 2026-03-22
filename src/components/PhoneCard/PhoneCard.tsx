import { Link } from 'react-router-dom';
import { LazyImage } from '@/components/LazyImage/LazyImage';
import type { ProductSummary } from '@/types/product.types';
import './PhoneCard.scss';

/** Props for the {@link PhoneCard} component. */
type PhoneCardProps = {
  /** Product data to display in the card. */
  product: ProductSummary;
};

/**
 * Catalog card that renders a product's image, brand, name, and formatted base price.
 *
 * The entire card is wrapped in a `<Link>` that navigates to `/products/:id`, so
 * it functions as both a list-view card and a similar-products carousel item.
 * Price is formatted with {@link Intl.NumberFormat} using `es-ES` locale and EUR currency.
 *
 * @param props - Component props.
 */
export const PhoneCard = ({ product }: PhoneCardProps) => {
  const formattedPrice = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
  }).format(product.basePrice);

  return (
    <Link to={`/products/${product.id}`} className="phone-card">
      <article className="phone-card__content">
        <div className="phone-card__image-wrapper">
          <LazyImage
            src={product.imageUrl}
            alt={`${product.brand} ${product.name}`}
            className="phone-card__image"
          />
        </div>
        <div className="phone-card__info">
          <div className="phone-card__brand-name">
            <p className="phone-card__brand">{product.brand}</p>
            <h3 className="phone-card__name">{product.name}</h3>
          </div>
          <p className="phone-card__price">{formattedPrice}</p>
        </div>
      </article>
    </Link>
  );
};
