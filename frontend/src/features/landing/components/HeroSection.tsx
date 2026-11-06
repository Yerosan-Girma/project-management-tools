import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Sparkles, Kanban } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32">
      {/* Background soft glow decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-500/10 dark:bg-primary-500/15 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Release Pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-medium text-primary-700 dark:border-primary-800/80 dark:bg-primary-950/60 dark:text-primary-300 mb-6 shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />
          <span>TeamFlow 2.0 with Real-Time Live Sync</span>
        </div>

        {/* Master Headline */}
        <h1 className="mx-auto max-w-4xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl dark:text-white leading-[1.15]">
          Bring Your Team's Work{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-indigo-600 to-primary-500">
            Together.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
          Plan projects, organize tasks, collaborate with your team, and track progress — all in one place.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/register" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Get Started
            </Button>
          </Link>
          <a href="#features" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto">
              Explore Features
            </Button>
          </a>
        </div>

        {/* Trust Badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Zero setup required
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            End-to-end WebSocket sync
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Multi-tenant workspaces
          </span>
        </div>

        {/* Mock Product Visual Container */}
        <div className="mt-14 relative mx-auto max-w-5xl rounded-2xl border border-slate-200/80 bg-slate-900/5 p-2 shadow-2xl backdrop-blur-sm dark:border-slate-800 dark:bg-slate-800/20">
          <div className="rounded-xl border border-slate-200/70 bg-white shadow-inner overflow-hidden dark:border-slate-800 dark:bg-slate-900">
            {/* Window chrome header */}
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-2.5 dark:border-slate-800 dark:bg-slate-950/60">
              <div className="flex items-center gap-1.5">
                <div className="h-3 w-3 rounded-full bg-rose-400" />
                <div className="h-3 w-3 rounded-full bg-amber-400" />
                <div className="h-3 w-3 rounded-full bg-emerald-400" />
              </div>
              <div className="flex items-center gap-2 rounded-md bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow-xs dark:bg-slate-800 dark:text-slate-300">
                <Kanban className="w-3.5 h-3.5 text-primary-500" />
                <span>Sprint Board — TeamFlow Core Platform</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">Live Sync</span>
              </div>
            </div>

            {/* Simulated Kanban Columns */}
            <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              {/* Column 1 */}
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    To Do
                  </span>
                  <Badge size="sm">3</Badge>
                </div>
                <div className="space-y-2.5">
                  <div className="rounded-lg bg-white p-3 shadow-sm border border-slate-200/60 dark:bg-slate-900 dark:border-slate-800 hover:shadow transition-shadow">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono font-semibold text-slate-400">TFL-101</span>
                      <Badge variant="warning" size="sm">Medium</Badge>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Integrate OAuth 2.0 social sign-in
                    </p>
                    <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                      <span>Due Nov 15</span>
                      <div className="h-5 w-5 rounded-full bg-indigo-500 text-white text-[9px] flex items-center justify-center font-bold">
                        JD
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg bg-white p-3 shadow-sm border border-slate-200/60 dark:bg-slate-900 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono font-semibold text-slate-400">TFL-104</span>
                      <Badge variant="default" size="sm">Low</Badge>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Audit accessibility compliance (WCAG AAA)
                    </p>
                  </div>
                </div>
              </div>

              {/* Column 2 */}
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                    In Progress
                  </span>
                  <Badge variant="primary" size="sm">2</Badge>
                </div>
                <div className="space-y-2.5">
                  <div className="rounded-lg bg-white p-3 shadow-sm border-l-4 border-l-primary-500 border border-slate-200/60 dark:bg-slate-900 dark:border-slate-800 hover:shadow transition-shadow">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono font-semibold text-primary-600">TFL-098</span>
                      <Badge variant="danger" size="sm">Urgent</Badge>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Real-time drag & drop state optimistic updates
                    </p>
                    <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                      <span className="text-amber-600 dark:text-amber-400 font-medium">Due Today</span>
                      <div className="flex -space-x-1">
                        <div className="h-5 w-5 rounded-full bg-primary-600 text-white text-[9px] flex items-center justify-center font-bold ring-2 ring-white dark:ring-slate-900">
                          AK
                        </div>
                        <div className="h-5 w-5 rounded-full bg-emerald-600 text-white text-[9px] flex items-center justify-center font-bold ring-2 ring-white dark:ring-slate-900">
                          SM
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Column 3 */}
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Completed
                  </span>
                  <Badge variant="success" size="sm">12</Badge>
                </div>
                <div className="space-y-2.5">
                  <div className="rounded-lg bg-white p-3 shadow-sm border border-slate-200/60 dark:bg-slate-900 dark:border-slate-800 opacity-80">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[10px] font-mono line-through text-slate-400">TFL-089</span>
                      <Badge variant="success" size="sm">Done</Badge>
                    </div>
                    <p className="text-xs font-semibold text-slate-600 line-through dark:text-slate-400">
                      Set up PostgreSQL schema and Prisma migrations
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
