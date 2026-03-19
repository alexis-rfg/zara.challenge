import { Link } from 'react-router-dom';
import { useCart } from '@/hooks/useCart';
import './Navbar.scss';

export const Navbar = () => {
  const { totalItems } = useCart();
  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="navbar__container">
        <Link to="/" className="navbar__home" aria-label="Go to home page">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </Link>

        <Link
          to="/cart"
          className="navbar__cart"
          aria-label={`Shopping cart with ${totalItems} items`}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
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
