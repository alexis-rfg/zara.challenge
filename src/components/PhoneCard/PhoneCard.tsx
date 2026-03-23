import { Link } from 'react-router-dom';
import { LazyImage } from '@/components/LazyImage/LazyImage';
import type { PhoneCardProps } from '@/types/components.types';
import './PhoneCard.scss';

const productPriceFormatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 0,
});

/**
 * Catalog card that renders a product's image, brand, name, and formatted base price.
 *
 * @param props - Component props.
 * @returns Product card link JSX.
 */
export const PhoneCard = ({
  product,
  headingTag: HeadingTag = 'h2',
  eagerImage = false,
}: PhoneCardProps) => {
  const formattedPrice = productPriceFormatter.format(product.basePrice);

  return (
    <Link to={`/products/${product.id}`} className="phone-card">
      <article className="phone-card__content">
        <div className="phone-card__image-wrapper">
          <LazyImage
            eager={eagerImage}
            src={product.imageUrl}
            alt={`${product.brand} ${product.name}`}
            className="phone-card__image"
            width={320}
            height={320}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        </div>
        <div className="phone-card__info">
          <div className="phone-card__brand-name">
            <p className="phone-card__brand">{product.brand}</p>
            <HeadingTag className="phone-card__name">{product.name}</HeadingTag>
          </div>
          <p className="phone-card__price">{formattedPrice}</p>
        </div>
      </article>
    </Link>
  );
};
