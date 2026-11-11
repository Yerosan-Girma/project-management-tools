import React from 'react';
import { Link } from 'react-router-dom';
import { footerPlatformLinks, footerProductLinks } from '../data/marketing';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-12 grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2 space-y-3 md:col-span-1">
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo/teamflow.svg" alt="TeamFlow" className="h-7 w-7" />
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                Team<span className="text-primary-600">Flow</span>
              </span>
            </Link>
            <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
              Project management for software, product, operations, and client teams — boards, tasks, calendar, and live collaboration in one workspace.
            </p>
            <div className="flex items-center gap-2 pt-2 text-xs font-medium text-emerald-600">
              <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              <span>All systems operational</span>
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Product</h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              {footerProductLinks.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="transition-colors hover:text-primary-600">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Platform</h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              {footerPlatformLinks.map((item) => (
                <li key={item.to}>
                  <Link to={item.to} className="transition-colors hover:text-primary-600">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">Get in</h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <Link to="/login" className="transition-colors hover:text-primary-600">
                  Sign in
                </Link>
              </li>
              <li>
                <Link to="/register" className="transition-colors hover:text-primary-600">
                  Create account
                </Link>
              </li>
              <li>
                <Link to="/security" className="transition-colors hover:text-primary-600">
                  JWT, RBAC, multi-tenancy
                </Link>
              </li>
              <li>
                <Link to="/contact" className="transition-colors hover:text-primary-600">
                  Talk to us
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-6 text-xs text-slate-400 sm:flex-row dark:border-slate-800">
          <p>© {new Date().getFullYear()} TeamFlow. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link to="/security" className="hover:text-primary-600">
              Security
            </Link>
            <Link to="/faq" className="hover:text-primary-600">
              Help
            </Link>
            <Link to="/contact" className="hover:text-primary-600">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
