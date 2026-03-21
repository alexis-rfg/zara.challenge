import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '@/components/Navbar/Navbar';
import { createLogger } from '@/utils/logger';
import './Layout.scss';

const navigationLogger = createLogger({
  scope: 'navigation.router',
  tags: ['navigation', 'router'],
});
let lastRouteKeyLogged: string | null = null;

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
