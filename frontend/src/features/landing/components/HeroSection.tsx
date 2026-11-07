import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Sparkles, Shield, Zap } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative overflow-hidden pt-16 pb-16 md:pt-24 md:pb-20">
      {/* Background ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] bg-primary-600/10 dark:bg-primary-500/15 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Release Pill */}
        <div className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-3.5 py-1 text-xs font-semibold text-primary-700 dark:border-primary-800/80 dark:bg-primary-950/60 dark:text-primary-300 mb-6 shadow-xs">
          <Sparkles className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />
          <span>TeamFlow 2.0 — Production-Grade SaaS Project Management</span>
        </div>

        {/* Master Headline */}
        <h1 className="mx-auto max-w-4xl text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
          Bring Your Team's Work{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-indigo-600 to-primary-500">
            Together.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
          Plan projects, organize tasks, collaborate with your team, and track progress — all in one centralized workspace.
        </p>

        {/* CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link to="/register" className="w-full sm:w-auto">
            <Button size="lg" className="w-full sm:w-auto font-semibold shadow-md" rightIcon={<ArrowRight className="w-4 h-4" />}>
              Get Started Free
            </Button>
          </Link>
          <Link to="/login" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto font-medium">
              Sign In to Workspace
            </Button>
          </Link>
        </div>

        {/* Trust Badges */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            Zero setup required
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500" />
            End-to-end WebSocket sync
          </span>
          <span className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-primary-500" />
            Role-based multi-tenancy
          </span>
        </div>
      </div>
    </section>
  );
};
