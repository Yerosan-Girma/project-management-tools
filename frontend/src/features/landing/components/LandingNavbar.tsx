import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Moon, Sun, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../../stores/auth-store';
import { useUIStore } from '../../../stores/ui-store';
import { Button } from '../../../components/ui/Button';

export const LandingNavbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { theme, toggleTheme } = useUIStore();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5">
          <img src="/logo/teamflow.svg" alt="TeamFlow Logo" className="h-8 w-8" />
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Team<span className="text-primary-600 dark:text-primary-400">Flow</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
          <a href="#features" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            Features
          </a>
          <a href="#preview" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            Product Preview
          </a>
          <a href="#how-it-works" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            How It Works
          </a>
          <a href="#faq" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            FAQ
          </a>
        </nav>

        {/* Right CTA */}
        <div className="hidden md:flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {isAuthenticated ? (
            <Link to="/dashboard">
              <Button size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="flex md:hidden items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-3 pb-6 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-col space-y-3">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Features
            </a>
            <a
              href="#preview"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Product Preview
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              How It Works
            </a>
            <a
              href="#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-md text-base font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              FAQ
            </a>
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
              {isAuthenticated ? (
                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full">Go to Dashboard</Button>
                </Link>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full">Get Started</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
