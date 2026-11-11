import React from 'react';
import { Badge } from '../../../components/ui/Badge';

interface PageHeroProps {
  eyebrow: string;
  title: string;
  description: string;
}

export const PageHero: React.FC<PageHeroProps> = ({ eyebrow, title, description }) => {
  return (
    <section className="relative overflow-hidden border-b border-slate-200/80 bg-slate-50/70 pt-16 pb-14 dark:border-slate-800 dark:bg-slate-900/40">
      <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-[520px] -translate-x-1/2 rounded-full bg-primary-600/10 blur-3xl dark:bg-primary-500/15" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Badge variant="primary" className="mb-4">
          {eyebrow}
        </Badge>
        <h1 className="max-w-3xl text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300">
          {description}
        </p>
      </div>
    </section>
  );
};
