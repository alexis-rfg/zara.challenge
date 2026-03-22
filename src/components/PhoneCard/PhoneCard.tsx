import { Link } from 'react-router-dom';
import { LazyImage } from '@/components/LazyImage/LazyImage';
import type { PhoneCardProps } from '@/types/components.types';
import './PhoneCard.scss';

/**
 * Catalog card that renders a product's image, brand, name, and formatted base price.
 *
 * @param props - Component props.
 * @returns Product card link JSX.
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
