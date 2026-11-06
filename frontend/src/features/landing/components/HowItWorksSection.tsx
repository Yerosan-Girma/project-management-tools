import React from 'react';
import { Building2, Columns3, CheckCircle2, TrendingUp } from 'lucide-react';

const steps = [
  {
    step: '01',
    title: 'Create Your Workspace',
    description: 'Set up an isolated workspace for your company or team, invite members by email, and grant role permissions.',
    icon: Building2,
  },
  {
    step: '02',
    title: 'Structure Projects & Boards',
    description: 'Create focused projects with designated project keys and automatic default Kanban boards with custom stages.',
    icon: Columns3,
  },
  {
    step: '03',
    title: 'Execute & Move Tasks',
    description: 'Assign tasks, specify priorities, add due dates, collaborate in threaded comments, and drag cards live.',
    icon: CheckCircle2,
  },
  {
    step: '04',
    title: 'Monitor Velocity & Progress',
    description: 'Gain real-time visibility into sprint completion percentages, overdue alerts, and individual team member workload.',
    icon: TrendingUp,
  },
];

export const HowItWorksSection: React.FC = () => {
  return (
    <section id="how-it-works" className="py-20 bg-slate-50/60 dark:bg-slate-900/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
            Simple 4-Step Process
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl mt-1">
            How TeamFlow Accelerates Delivery
          </h2>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-400">
            From initial project inception to final delivery, your entire workflow stays organized in one unified platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {steps.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="relative rounded-2xl bg-white p-6 shadow-sm border border-slate-200/80 dark:bg-slate-900 dark:border-slate-800 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-2xl font-bold text-primary-600/30 dark:text-primary-400/30">
                      {item.step}
                    </span>
                    <div className="h-10 w-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center dark:bg-primary-950/60 dark:text-primary-400">
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
