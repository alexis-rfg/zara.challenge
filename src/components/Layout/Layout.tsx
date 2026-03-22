import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '@/components/Navbar/Navbar';
import { createLogger } from '@/utils/logger';
import './Layout.scss';

const navigationLogger = createLogger({
  scope: 'navigation.router',
  tags: ['navigation', 'router'],
});
/**
 * Tracks the last `pathname + search` string that was logged to prevent
 * duplicate `route_view` events from React StrictMode's double-mount in development.
 */
let lastRouteKeyLogged: string | null = null;

/**
 * Root layout wrapper rendered for every route via React Router's `<Outlet>`.
 *
 * Responsibilities:
 * - Renders the {@link Navbar} above all page content.
 * - Wraps the outlet in a `.page-transition` keyed on `pathname` so CSS
 *   animations replay on each navigation.
 * - Fires a `route_view` log event on path/search changes (deduplicated to
 *   avoid double-logging under React StrictMode).
 */
export const Layout = () => {
  const location = useLocation();

  useEffect(() => {
    const routeKey = `${location.pathname}${location.search}`;

    if (lastRouteKeyLogged === routeKey) {
      return;
    }

    lastRouteKeyLogged = routeKey;

    navigationLogger.info('route_view', {
      tags: ['page-view'],
      context: {
        pathname: location.pathname,
        search: location.search,
      },
    });
  }, [location.pathname, location.search]);

  return (
    <div className="layout">
      <Navbar />
      <main>
        <div key={location.pathname} className="page-transition">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
