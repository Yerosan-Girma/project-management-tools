import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { LandingNavbar } from '../../features/landing/components/LandingNavbar';
import { LandingFooter } from '../../features/landing/components/LandingFooter';

export const MarketingLayout: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '').split('?')[0];
      const timer = window.setTimeout(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
      return () => window.clearTimeout(timer);
    }
    window.scrollTo(0, 0);
    return undefined;
  }, [location.pathname, location.hash]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 antialiased selection:bg-primary-500 selection:text-white dark:bg-slate-950 dark:text-slate-100">
      <LandingNavbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <LandingFooter />
    </div>
  );
};

export default MarketingLayout;
