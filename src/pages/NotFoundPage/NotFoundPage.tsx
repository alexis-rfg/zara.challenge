import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './NotFoundPage.scss';

/**
 * Catch-all 404 page rendered for any route that does not match the defined routes.
 * Displays a simple message and a link back to the home page.
 */
export const NotFoundPage = () => {
  const { t } = useTranslation();

  return (
    <div className="not-found">
      <h1>{t('notFoundPage.heading')}</h1>
      <p>{t('notFoundPage.message')}</p>
      <Link to="/" className="not-found__link">
        {t('notFoundPage.backHome')}
      </Link>
    </div>
  );
};
