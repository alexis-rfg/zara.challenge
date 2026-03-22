import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '@/hooks/useCart';
import { BackButton } from '@/components/BackButton/BackButton';
import { LanguageSwitcher } from '@/components/LanguageSwitcher/LanguageSwitcher';
import './Navbar.scss';

/**
 * Site-wide navigation bar rendered on every page via the `Layout` component.
 *
 * ### Behaviour
 * - Always shows the MBST logo (no link — clicking the logo does not navigate).
 * - Shows a {@link LanguageSwitcher} globe dropdown next to the logo.
 * - Shows the cart icon with an item count badge on all pages **except** `/cart`
 *   (hiding it on the cart page avoids a redundant self-link).
 * - Shows a {@link BackButton} sub-bar beneath the main bar on product detail
 *   pages (`/products/:id`).
 *
 * Cart item count is read from {@link useCart} which is backed by `localStorage`,
 * so the count persists across page reloads.
 */
export const Navbar = () => {
  const { t } = useTranslation();
  const { totalItems } = useCart();
  const { pathname } = useLocation();
  const isCartPage = pathname === '/cart';
  const showBackButton = pathname.startsWith('/products/');

  return (
    <nav className="navbar" role="navigation" aria-label={t('nav.mainNavLabel')}>
      <div className="navbar__main">
        <div className="navbar__container">
          <div className="navbar__home">
            <img
              src="/logo/Frame 1.png"
              alt={t('nav.logoAlt')}
              className="navbar__logo"
              width="74"
              height="24"
            />
            <LanguageSwitcher />
          </div>

          {!isCartPage && (
            <Link
              to="/cart"
              className="navbar__cart"
              aria-label={t('nav.cartLabel', { count: totalItems })}
            >
              <img
                src="/icons/bag-icon.png"
                alt=""
                aria-hidden="true"
                className="navbar__cart-icon"
                width="18"
                height="18"
              />
              <span
                className="navbar__cart-count"
                aria-label={t('nav.cartCountLabel', { count: totalItems })}
              >
                {totalItems}
              </span>
            </Link>
          )}
        </div>
      </div>

      {showBackButton && (
        <div className="navbar__back-bar">
          <BackButton />
        </div>
      )}
    </nav>
  );
};
