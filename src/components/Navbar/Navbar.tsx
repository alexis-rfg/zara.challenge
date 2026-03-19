import { Link } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import './Navbar.scss';

export const Navbar = () => {
  const { totalItems } = useCart();
  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="navbar__container">
        <Link to="/" className="navbar__home" aria-label="Go to home page">
          <img
            src="/icons/Frame 1.png"
            alt="MBST home"
            className="navbar__logo"
            width="74"
            height="24"
          />
        </Link>

        <Link
          to="/cart"
          className="navbar__cart"
          aria-label={`Shopping cart with ${totalItems} items`}
        >
          <img
            src="/icons/bag-icon.png"
            alt=""
            aria-hidden="true"
            className="navbar__cart-icon"
            width="18"
            height="18"
          />
          {totalItems > 0 && (
            <span className="navbar__cart-count" aria-label={`${totalItems} items in cart`}>
              {totalItems}
            </span>
          )}
        </Link>
      </div>
    </nav>
  );
};
