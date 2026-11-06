import React from 'react';
import { Link } from 'react-router-dom';
import { Moon, Sun, CheckCircle2, Kanban, Zap, ShieldCheck } from 'lucide-react';
import { useUIStore } from '../../stores/ui-store';

export interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  const { theme, toggleTheme } = useUIStore();

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      {/* Left Form Panel */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-12 lg:p-16 max-w-xl mx-auto w-full">
        <div>
          {/* Top Brand & Theme Switcher */}
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="flex items-center gap-2.5">
              <img src="/logo/teamflow.svg" alt="TeamFlow" className="h-8 w-8" />
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Team<span className="text-primary-600">Flow</span>
              </span>
            </Link>

            <button
              type="button"
              onClick={toggleTheme}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
              {title}
            </h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {subtitle}
            </p>
          </div>

          {/* Form Content */}
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            {children}
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-8 text-center text-xs text-slate-400">
          <p>© {new Date().getFullYear()} TeamFlow Platform Inc. All rights reserved.</p>
        </div>
      </div>

      {/* Right Feature Showcase (desktop only) */}
      <div className="hidden lg:flex flex-1 relative bg-gradient-to-br from-primary-900 via-primary-950 to-slate-950 text-white p-16 flex-col justify-between overflow-hidden">
        {/* Abstract background blur accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md">
            Production-Ready Project Architecture
          </span>
          <h2 className="mt-6 text-3xl font-extrabold leading-snug tracking-tight max-w-md">
            The modern standard for high-performance team delivery.
          </h2>
        </div>

        {/* Feature Highlights */}
        <div className="relative z-10 space-y-6 max-w-md my-auto">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm shrink-0">
              <Kanban className="w-5 h-5 text-primary-300" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Real-Time Kanban Workflows</h3>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                Drag, drop, assign, and organize deliverables with zero latency across your distributed team.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm shrink-0">
              <Zap className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">WebSocket Event Broadcasts</h3>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                Live updates for tasks, comments, and project notifications streamed instantly via Socket.IO.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="p-2 rounded-lg bg-white/10 backdrop-blur-sm shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Granular Role Governance</h3>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                Multi-tenant workspace isolation with strict Owner, Admin, Member, and Viewer permissions.
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-6 text-xs text-slate-300">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> PostgreSQL & Prisma
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" /> JWT Dual Auth
          </span>
        </div>
      </div>
    </div>
  );
};
