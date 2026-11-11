import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Code2, Compass, Briefcase, Building2 } from 'lucide-react';
import { Card, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { solutionTypes } from '../data/marketing';
import { cn } from '../../../utils/cn';

const icons = [Code2, Compass, Briefcase, Building2];

export const ProjectTypesSection: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeId, setActiveId] = useState(searchParams.get('type') || 'software');
  const active = solutionTypes.find((item) => item.id === activeId) ?? solutionTypes[0];

  useEffect(() => {
    const type = searchParams.get('type');
    if (type && solutionTypes.some((item) => item.id === type)) {
      setActiveId(type);
    }
  }, [searchParams]);

  const selectType = (id: string) => {
    setActiveId(id);
    const next = new URLSearchParams(searchParams);
    next.set('type', id);
    setSearchParams(next, { replace: true });
  };

  return (
    <section id="solutions" className="scroll-mt-20 border-y border-slate-200/60 bg-white py-20 dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
            Project types
          </span>
          <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            The same workspace, shaped for how you ship
          </h2>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            Pick a team type to see which boards, roles, and views you will actually use.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <div className="flex flex-col gap-2">
            {solutionTypes.map((item, index) => {
              const Icon = icons[index];
              const selected = item.id === activeId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => selectType(item.id)}
                  className={cn(
                    'flex items-start gap-3 rounded-2xl border p-4 text-left transition-all',
                    selected
                      ? 'border-primary-200 bg-primary-50 shadow-sm dark:border-primary-800 dark:bg-primary-950/40'
                      : 'border-slate-200 bg-slate-50 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                      selected
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-slate-500 dark:bg-slate-800 dark:text-slate-300'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span>
                    <span className="block text-sm font-semibold text-slate-900 dark:text-white">{item.label}</span>
                    <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{item.title}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <Card className="rounded-2xl">
            <CardContent className="p-6 sm:p-8">
              <p className="text-xs font-bold uppercase tracking-wider text-primary-600">{active.label} teams</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{active.title}</h3>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">{active.description}</p>
              <ul className="mt-6 grid gap-2 sm:grid-cols-3">
                {active.highlights.map((item) => (
                  <li
                    key={item}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300"
                  >
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/features">
                  <Button size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                    Explore features
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" variant="outline">
                    Start a workspace
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};
