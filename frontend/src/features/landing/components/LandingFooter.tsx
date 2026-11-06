import React from 'react';
import { Link } from 'react-router-dom';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand info */}
          <div className="col-span-2 md:col-span-1 space-y-3">
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo/teamflow.svg" alt="TeamFlow Logo" className="h-7 w-7" />
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                Team<span className="text-primary-600">Flow</span>
              </span>
            </Link>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Modern project management and real-time collaboration for high-performing engineering and product teams.
            </p>
            <div className="flex items-center gap-2 pt-2 text-xs text-emerald-600 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All Systems Operational</span>
            </div>
          </div>

          {/* Product links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4">
              Product
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <a href="#features" className="hover:text-primary-600 transition-colors">
                  Kanban Boards
                </a>
              </li>
              <li>
                <a href="#preview" className="hover:text-primary-600 transition-colors">
                  Real-time Sync
                </a>
              </li>
              <li>
                <a href="#preview" className="hover:text-primary-600 transition-colors">
                  Sprint Analytics
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-primary-600 transition-colors">
                  Workspaces
                </a>
              </li>
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4">
              Platform
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li>
                <Link to="/login" className="hover:text-primary-600 transition-colors">
                  Sign In
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-primary-600 transition-colors">
                  Create Account
                </Link>
              </li>
              <li>
                <a href="/api-docs" target="_blank" rel="noreferrer" className="hover:text-primary-600 transition-colors">
                  API Documentation
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-primary-600 transition-colors">
                  Help & FAQs
                </a>
              </li>
            </ul>
          </div>

          {/* Legal / Security */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white mb-4">
              Security
            </h4>
            <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
              <li className="text-slate-500">JWT Dual-Token Auth</li>
              <li className="text-slate-500">PostgreSQL Isolated DB</li>
              <li className="text-slate-500">Strict Multi-Tenancy</li>
              <li className="text-slate-500">WCAG Compliant UI</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-100 dark:border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400">
          <p>© {new Date().getFullYear()} TeamFlow Platform Inc. All rights reserved.</p>
          <div className="flex items-center gap-4 mt-3 sm:mt-0">
            <span>Built with React & TypeScript</span>
            <span>•</span>
            <span>Socket.IO Real-time Engine</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
