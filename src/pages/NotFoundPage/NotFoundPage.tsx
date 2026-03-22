import { Link } from 'react-router-dom';
import './NotFoundPage.scss';

/**
 * Catch-all 404 page rendered for any route that does not match the defined routes.
 * Displays a simple message and a link back to the home page.
 */
export const NotFoundPage = () => {
  return (
    <div className="not-found">
      <h1>404 - Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <Link to="/" className="not-found__link">
        Go back home
      </Link>
    </div>
  );
};
