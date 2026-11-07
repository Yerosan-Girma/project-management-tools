import React from 'react';
import { Building2, Columns3, CheckCircle2 } from 'lucide-react';

const steps = [
  {
    step: '01',
    title: 'Create Your Workspace',
    description: 'Set up an isolated workspace for your team or organization, invite collaborators, and establish role permissions.',
    icon: Building2,
  },
  {
    step: '02',
    title: 'Organize on Kanban Boards',
    description: 'Structure projects with custom Kanban columns, assign tasks with priority and deadlines, and collaborate live.',
    icon: Columns3,
  },
  {
    step: '03',
    title: 'Coordinate & Deliver with Velocity',
    description: 'Gain real-time visibility into sprint progress, upcoming deadlines, team discussions, and milestone completion.',
    icon: CheckCircle2,
  },
];

export const HowItWorksSection: React.FC = () => {
  return (
    <section id="how-it-works" className="py-20 bg-slate-50/60 dark:bg-slate-900/40 border-b border-slate-200/60 dark:border-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
            How It Works
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl mt-1">
            Three simple steps to stream-aligned delivery
          </h2>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            From initial project inception to final delivery, your entire workflow stays organized in one unified platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="relative rounded-2xl bg-white dark:bg-slate-900 p-7 shadow-xs border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="font-mono text-3xl font-extrabold text-primary-600/25 dark:text-primary-400/30">
                      {item.step}
                    </span>
                    <div className="h-11 w-11 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center dark:bg-primary-950/60 dark:text-primary-400">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
