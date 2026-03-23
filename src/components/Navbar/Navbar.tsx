import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '@/hooks/useCart';
import { BackButton } from '@/components/BackButton/BackButton';
import { LanguageSwitcher } from '@/components/LanguageSwitcher/LanguageSwitcher';
import { CartIcon } from '@/components/icons/CartIcon';
import './Navbar.scss';

/**
 * Site-wide navigation bar rendered on every page via the Layout component.
 *
 * @returns Global navigation JSX.
 */
export const Navbar = () => {
  const { t } = useTranslation();
  const { totalItems } = useCart();
  const { pathname } = useLocation();
  const isCartPage = pathname === '/cart';
  const showBackButton = pathname.startsWith('/products/');

  const cartLink = isCartPage ? null : (
    <Link
      to="/cart"
      className="navbar__cart"
      aria-label={t('nav.cartLabel', { count: totalItems })}
    >
      <CartIcon />
      <span
        className="navbar__cart-count"
        aria-label={t('nav.cartCountLabel', { count: totalItems })}
      >
        {totalItems}
      </span>
    </Link>
  );

  const backBar = showBackButton ? (
    <div className="navbar__back-bar">
      <BackButton />
    </div>
  ) : null;

  return (
    <nav className="navbar" role="navigation" aria-label={t('nav.mainNavLabel')}>
      <div className="navbar__main">
        <div className="navbar__container">
          <div className="navbar__home">
            <Link to="/" className="navbar__logo-link">
              <img
                src="/logo/Frame 1.png"
                alt={t('nav.logoAlt')}
                className="navbar__logo"
                width="74"
                height="24"
                decoding="async"
                fetchPriority="high"
              />
            </Link>
            <LanguageSwitcher />
          </div>
          {cartLink}
        </div>
      </div>
      {backBar}
    </nav>
  );
};
