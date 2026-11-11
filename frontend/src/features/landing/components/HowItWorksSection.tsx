import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Columns3, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../utils/cn';

const steps = [
  {
    step: '01',
    title: 'Create your workspace',
    description: 'Spin up an isolated workspace, invite collaborators, and set Owner / Admin / Member / Viewer roles.',
    icon: Building2,
  },
  {
    step: '02',
    title: 'Organize on Kanban boards',
    description: 'Create projects, customize columns, assign tasks with priority and deadlines, and collaborate live.',
    icon: Columns3,
  },
  {
    step: '03',
    title: 'Coordinate and deliver',
    description: 'Watch deadlines on the calendar, track velocity, and keep comments and notifications in one place.',
    icon: CheckCircle2,
  },
];

export const HowItWorksSection: React.FC = () => {
  const [active, setActive] = useState(0);

  return (
    <section id="how-it-works" className="scroll-mt-20 border-b border-slate-200/60 bg-white py-20 dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
            How it works
          </span>
          <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            Three steps from empty workspace to live delivery
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {steps.map((item, index) => {
            const Icon = item.icon;
            const selected = active === index;
            return (
              <button
                key={item.step}
                type="button"
                onClick={() => setActive(index)}
                className={cn(
                  'rounded-2xl border p-7 text-left transition-all',
                  selected
                    ? 'border-primary-200 bg-primary-50/70 shadow-md dark:border-primary-800 dark:bg-primary-950/30'
                    : 'border-slate-200/80 bg-slate-50 hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900'
                )}
              >
                <div className="mb-5 flex items-center justify-between">
                  <span className="font-mono text-3xl font-extrabold text-primary-600/25 dark:text-primary-400/30">
                    {item.step}
                  </span>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <h3 className="mb-2 text-base font-semibold text-slate-900 dark:text-white">{item.title}</h3>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">{item.description}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Link to="/how-it-works">
            <Button variant="outline" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
              See the full walkthrough
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
