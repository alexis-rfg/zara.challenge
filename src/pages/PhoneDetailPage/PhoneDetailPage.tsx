import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProductDetail } from '@/hooks/useProductDetail';
import { useCart } from '@/hooks/useCart';
import { ColorSelector } from '@/components/ColorSelector/ColorSelector';
import { StorageSelector } from '@/components/StorageSelector/StorageSelector';
import { SimilarProducts } from '@/components/SimilarProducts/SimilarProducts';
import './PhoneDetailPage.scss';

const SPEC_ROWS = [
  { label: 'Brand', key: 'brand' as const },
  { label: 'Name', key: 'name' as const },
  { label: 'Description', key: 'description' as const },
] as const;

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

export const PhoneDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { product, loading, error } = useProductDetail(id);
  const { addItem } = useCart();

  const [selectedColorIndex, setSelectedColorIndex] = useState<number | null>(null);
  const [selectedStorageIndex, setSelectedStorageIndex] = useState<number | null>(null);

  const handleColorSelect = (index: number) => {
    setSelectedColorIndex(index);
    if (selectedStorageIndex === null) setSelectedStorageIndex(0);
  };

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
          <img
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
