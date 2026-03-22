import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProductDetail } from '@/hooks/useProductDetail';
import { useCart } from '@/hooks/useCart';
import { LazyImage } from '@/components/LazyImage/LazyImage';
import { ColorSelector } from '@/components/ColorSelector/ColorSelector';
import { StorageSelector } from '@/components/StorageSelector/StorageSelector';
import { SimilarProducts } from '@/components/SimilarProducts/SimilarProducts';
import './PhoneDetailPage.scss';

/**
 * Top-level product attributes rendered in the specifications table
 * before the technical spec rows. Keys map directly to {@link ProductDetail} fields.
 */
const SPEC_ROWS = [
  { label: 'Brand', key: 'brand' as const },
  { label: 'Name', key: 'name' as const },
  { label: 'Description', key: 'description' as const },
] as const;

/**
 * Technical specification rows rendered in the specifications table.
 * Keys map to {@link ProductSpecs} fields. The order here determines
 * the display order in the UI.
 */
const TECH_SPEC_ROWS = [
  { label: 'Screen', key: 'screen' as const },
  { label: 'Resolution', key: 'resolution' as const },
  { label: 'Processor', key: 'processor' as const },
  { label: 'Main Camera', key: 'mainCamera' as const },
  { label: 'Selfie Camera', key: 'selfieCamera' as const },
  { label: 'Battery', key: 'battery' as const },
  { label: 'OS', key: 'os' as const },
  { label: 'Screen Refresh Rate', key: 'screenRefreshRate' as const },
] as const;

/**
 * Product detail page — rendered at `/products/:id`.
 *
 * ### Sections
 * 1. **Hero** — large product image (updates on colour selection) + name, price, selectors,
 *    and the "Añadir" CTA button.
 * 2. **Specifications** — definition list with brand/name/description plus all 8 technical
 *    spec fields from the API.
 * 3. **Similar items** — horizontal carousel via {@link SimilarProducts}.
 *
 * ### Selection model
 * - `selectedColorIndex` and `selectedStorageIndex` are independent pieces of local state.
 * - Selecting one auto-defaults the other to index `0` so the button can become enabled
 *   with a single interaction.
 * - Selections are reset to `null` whenever `id` changes (navigating to a similar product).
 *
 * ### Add-to-cart
 * - The CTA button is `disabled` + `aria-disabled` until **both** selections are made.
 * - On click, the resolved colour + storage values (image URL, colour name, capacity, price)
 *   are committed to cart context and the user is navigated to `/cart`.
 *
 * ### States handled
 * - **Loading** — spinner.
 * - **Error / missing product** — error message with "Back to Home" button.
 * - **Loaded** — full page content.
 */
export const PhoneDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { product, loading, error } = useProductDetail(id);
  const { addItem } = useCart();

  const [selectedColorIndex, setSelectedColorIndex] = useState<number | null>(null);
  const [selectedStorageIndex, setSelectedStorageIndex] = useState<number | null>(null);

  /**
   * Selects a colour by index and auto-defaults storage to 0 if not yet chosen,
   * so one interaction is enough to enable the "Añadir" button.
   */
  const handleColorSelect = (index: number) => {
    setSelectedColorIndex(index);
    if (selectedStorageIndex === null) setSelectedStorageIndex(0);
  };

  /**
   * Selects a storage tier by index and auto-defaults colour to 0 if not yet chosen,
   * so one interaction is enough to enable the "Añadir" button.
   */
  const handleStorageSelect = (index: number) => {
    setSelectedStorageIndex(index);
    if (selectedColorIndex === null) setSelectedColorIndex(0);
  };

  useEffect(() => {
    if (product) {
      document.title = `${product.brand} ${product.name} — MBST`;
    }
    return () => {
      document.title = 'MBST';
    };
  }, [product]);

  // Reset selections when product changes (navigating between similar products)
  useEffect(() => {
    setSelectedColorIndex(null);
    setSelectedStorageIndex(null);
  }, [id]);

  if (loading) {
    return (
      <div className="phone-detail-page__loading" aria-live="polite" aria-label="Loading product">
        <div className="phone-detail-page__spinner" role="status" />
        <p>Loading...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="phone-detail-page__error" role="alert">
        <h2>Product not found</h2>
        <p>{error ?? 'The product you are looking for does not exist.'}</p>
        <button onClick={() => navigate('/')}>Back to Home</button>
      </div>
    );
  }

  const canAddToCart = selectedColorIndex !== null && selectedStorageIndex !== null;
  const currentImageUrl =
    selectedColorIndex !== null
      ? (product.colorOptions[selectedColorIndex]?.imageUrl ?? product.colorOptions[0]?.imageUrl)
      : product.colorOptions[0]?.imageUrl;

  const currentPrice =
    selectedStorageIndex !== null
      ? (product.storageOptions[selectedStorageIndex]?.price ?? product.basePrice)
      : product.basePrice;

  const formattedPrice = new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
  }).format(currentPrice);

  /**
   * Resolves the selected colour and storage options, adds the item to the cart
   * with all values captured at add-time (image URL, colour name, capacity, price),
   * then navigates to `/cart`. The guard at the top is a safety check — the button
   * is already `disabled` when `canAddToCart` is false.
   */
  const handleAddToCart = () => {
    if (!canAddToCart || selectedColorIndex === null || selectedStorageIndex === null) return;
    const selectedColor = product.colorOptions[selectedColorIndex];
    const selectedStorage = product.storageOptions[selectedStorageIndex];
    if (!selectedColor || !selectedStorage) return;
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
    <main className="phone-detail-page">
      {/* Hero: image + product info */}
      <section className="phone-detail-page__hero" aria-label="Product details">
        <div className="phone-detail-page__image-wrapper">
          <LazyImage
            eager
            src={currentImageUrl}
            alt={`${product.brand} ${product.name}`}
            className="phone-detail-page__image"
          />
        </div>

        <div className="phone-detail-page__product-info">
          <div className="phone-detail-page__title-price">
            <h1 className="phone-detail-page__title">{product.name}</h1>
            <p className="phone-detail-page__price">from {formattedPrice} EUR</p>
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
            Añadir
          </button>
        </div>
      </section>

      {/* Specifications */}
      <section className="phone-detail-page__specs" aria-label="Specifications">
        <h2 className="phone-detail-page__specs-heading">SPECIFICATIONS</h2>
        <dl className="phone-detail-page__specs-list">
          {SPEC_ROWS.map(({ label, key }) => (
            <div key={key} className="phone-detail-page__spec-row">
              <dt className="phone-detail-page__spec-label">{label}</dt>
              <dd className="phone-detail-page__spec-value">{product[key]}</dd>
            </div>
          ))}
          {TECH_SPEC_ROWS.map(({ label, key }) => (
            <div key={key} className="phone-detail-page__spec-row">
              <dt className="phone-detail-page__spec-label">{label}</dt>
              <dd className="phone-detail-page__spec-value">{product.specs[key]}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Similar products */}
      <SimilarProducts products={product.similarProducts} />
    </main>
  );
};
