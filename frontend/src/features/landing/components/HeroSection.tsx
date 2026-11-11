import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Sparkles, Shield, Zap } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { solutionTypes } from '../data/marketing';
import { cn } from '../../../utils/cn';
import { useAuthStore } from '../../../stores/auth-store';

export const HeroSection: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const typeFromUrl = searchParams.get('type') || 'software';
  const [activeId, setActiveId] = useState(typeFromUrl);
  const active = useMemo(
    () => solutionTypes.find((item) => item.id === activeId) ?? solutionTypes[0],
    [activeId]
  );

  useEffect(() => {
    if (solutionTypes.some((item) => item.id === typeFromUrl)) {
      setActiveId(typeFromUrl);
    }
  }, [typeFromUrl]);

  const selectType = (id: string) => {
    setActiveId(id);
    const next = new URLSearchParams(searchParams);
    next.set('type', id);
    setSearchParams(next, { replace: true });
  };

  return (
    <section className="relative overflow-hidden pb-16 pt-16 md:pb-20 md:pt-20">
      <div className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-[450px] w-[650px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-600/10 blur-3xl dark:bg-primary-500/15" />

      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-3.5 py-1 text-xs font-semibold text-primary-700 shadow-xs dark:border-primary-800/80 dark:bg-primary-950/60 dark:text-primary-300">
          <Sparkles className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />
          <span>Workspaces, boards, tasks, calendar — one platform</span>
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
          {solutionTypes.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => selectType(item.id)}
              className={cn(
                'rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all',
                activeId === item.id
                  ? 'border-primary-600 bg-primary-600 text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-primary-200 hover:text-primary-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-primary-800'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <h1 className="mx-auto max-w-4xl text-4xl font-extrabold leading-[1.12] tracking-tight text-slate-900 sm:text-6xl dark:text-white">
          {active.title.split(' ').slice(0, -2).join(' ')}{' '}
          <span className="bg-gradient-to-r from-primary-600 via-indigo-600 to-primary-500 bg-clip-text text-transparent">
            {active.title.split(' ').slice(-2).join(' ')}
          </span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300">
          {active.description}
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          {active.highlights.map((item) => (
            <span
              key={item}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            >
              {item}
            </span>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-3.5 sm:flex-row">
          {isAuthenticated ? (
            <Link to="/dashboard" className="w-full sm:w-auto">
              <Button size="lg" className="w-full font-semibold shadow-md sm:w-auto" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Continue to dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full font-semibold shadow-md sm:w-auto" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Get started free
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full font-medium sm:w-auto">
                  Sign in to workspace
                </Button>
              </Link>
            </>
          )}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            Zero setup required
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="h-4 w-4 text-amber-500" />
            Live WebSocket sync
          </span>
          <span className="flex items-center gap-1.5">
            <Shield className="h-4 w-4 text-primary-500" />
            Role-based workspaces
          </span>
        </div>
      </div>
    </section>
  );
};
