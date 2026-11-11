import React, { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  Moon,
  Sun,
  ArrowRight,
  ChevronDown,
  Kanban,
  FolderGit2,
  CheckSquare,
  CalendarDays,
  Users,
  BarChart3,
  LayoutDashboard,
  Layers,
} from 'lucide-react';
import { useAuthStore } from '../../../stores/auth-store';
import { useUIStore } from '../../../stores/ui-store';
import { Button } from '../../../components/ui/Button';
import {
  appNavForSignedIn,
  companyMenu,
  marketingNav,
  productMenu,
  solutionTypes,
} from '../data/marketing';
import { cn } from '../../../utils/cn';

const productIcons = [Kanban, FolderGit2, CheckSquare, CalendarDays, Users, BarChart3];

export const LandingNavbar: React.FC = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<'product' | 'solutions' | 'company' | 'work' | null>(null);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { theme, toggleTheme } = useUIStore();
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setMobileOpen(false);
    setOpenMenu(null);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const isMarketingActive = (to: string) =>
    location.pathname === to || (to === '/' && location.pathname === '/');

  return (
    <header
      ref={navRef}
      className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/85 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/85"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <img src="/logo/teamflow.svg" alt="TeamFlow" className="h-8 w-8" />
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Team<span className="text-primary-600 dark:text-primary-400">Flow</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenMenu(openMenu === 'product' ? null : 'product')}
              className={cn(
                'inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                location.pathname.startsWith('/features') || openMenu === 'product'
                  ? 'bg-slate-100 text-primary-700 dark:bg-slate-800 dark:text-primary-300'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
              )}
            >
              Product
              <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', openMenu === 'product' && 'rotate-180')} />
            </button>
            {openMenu === 'product' && (
              <div className="absolute left-0 top-full z-50 mt-2 w-[34rem] rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                <div className="grid grid-cols-2 gap-1">
                  {productMenu.map((item, index) => {
                    const Icon = productIcons[index];
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        className="flex gap-3 rounded-xl p-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/80"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-300">
                          <Icon className="h-4 w-4" />
                        </div>
                        <span>
                          <span className="block text-sm font-semibold text-slate-900 dark:text-white">{item.title}</span>
                          <span className="mt-0.5 block text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                            {item.description}
                          </span>
                        </span>
                      </Link>
                    );
                  })}
                </div>
                <Link
                  to="/features"
                  className="mt-1 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-primary-700 hover:bg-slate-100 dark:bg-slate-800/70 dark:text-primary-300 dark:hover:bg-slate-800"
                >
                  View all features
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenMenu(openMenu === 'solutions' ? null : 'solutions')}
              className={cn(
                'inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                openMenu === 'solutions'
                  ? 'bg-slate-100 text-primary-700 dark:bg-slate-800 dark:text-primary-300'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
              )}
            >
              Solutions
              <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', openMenu === 'solutions' && 'rotate-180')} />
            </button>
            {openMenu === 'solutions' && (
              <div className="absolute left-0 top-full z-50 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                {solutionTypes.map((item) => (
                  <Link
                    key={item.id}
                    to={`/?type=${item.id}#solutions`}
                    onClick={() => setOpenMenu(null)}
                    className="block rounded-xl px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/80"
                  >
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{item.label}</span>
                    <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{item.title}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {isAuthenticated && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenMenu(openMenu === 'work' ? null : 'work')}
                className={cn(
                  'inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  ['/dashboard', '/my-tasks', '/projects', '/calendar', '/team', '/workspaces'].some((p) =>
                    location.pathname.startsWith(p)
                  ) || openMenu === 'work'
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                )}
              >
                Workspace
                <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', openMenu === 'work' && 'rotate-180')} />
              </button>
              {openMenu === 'work' && (
                <div className="absolute left-0 top-full z-50 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                  {appNavForSignedIn.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium',
                          isActive
                            ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300'
                            : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                        )
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                  <NavLink
                    to="/workspaces"
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <Layers className="h-3.5 w-3.5" />
                    Workspaces
                  </NavLink>
                </div>
              )}
            </div>
          )}

          {marketingNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={() =>
                cn(
                  'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isMarketingActive(item.to)
                    ? 'bg-slate-100 text-primary-700 dark:bg-slate-800 dark:text-primary-300'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                )
              }
            >
              {item.label}
            </NavLink>
          ))}

          <div className="relative">
            <button
              type="button"
              onClick={() => setOpenMenu(openMenu === 'company' ? null : 'company')}
              className={cn(
                'inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                ['/about', '/security', '/contact'].includes(location.pathname) || openMenu === 'company'
                  ? 'bg-slate-100 text-primary-700 dark:bg-slate-800 dark:text-primary-300'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
              )}
            >
              Company
              <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', openMenu === 'company' && 'rotate-180')} />
            </button>
            {openMenu === 'company' && (
              <div className="absolute left-0 top-full z-50 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                {companyMenu.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="block rounded-xl px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/80"
                  >
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{item.title}</span>
                    <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{item.description}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            title="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {isAuthenticated ? (
            <Link to="/dashboard">
              <Button size="sm" leftIcon={<LayoutDashboard className="h-4 w-4" />} rightIcon={<ArrowRight className="h-4 w-4" />}>
                Open dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Get started
                </Button>
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 lg:hidden">
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen((open) => !open)}
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950 lg:hidden">
          <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Product</p>
          <div className="mt-1 mb-3 grid grid-cols-1 gap-1">
            {productMenu.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {item.title}
              </Link>
            ))}
          </div>

          <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Solutions</p>
          <div className="mt-1 mb-3 space-y-1">
            {solutionTypes.map((item) => (
              <Link
                key={item.id}
                to={`/?type=${item.id}#solutions`}
                className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {item.label}
              </Link>
            ))}
          </div>

          <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Pages</p>
          <div className="mt-1 space-y-1">
            {marketingNav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'block rounded-xl px-3 py-2 text-sm font-medium',
                  isMarketingActive(item.to)
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                )}
              >
                {item.label}
              </Link>
            ))}
            {companyMenu.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  'block rounded-xl px-3 py-2 text-sm font-medium',
                  isMarketingActive(item.to)
                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-950/50 dark:text-primary-300'
                    : 'text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800'
                )}
              >
                {item.title}
              </Link>
            ))}
          </div>

          {isAuthenticated && (
            <>
              <p className="mt-4 px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Workspace</p>
              <div className="mt-1 space-y-1">
                {appNavForSignedIn.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </>
          )}

          <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            {isAuthenticated ? (
              <Link to="/dashboard">
                <Button className="w-full">Open dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="outline" className="w-full">
                    Sign in
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="w-full">Get started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
