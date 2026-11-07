import React from 'react';
import { Kanban, Zap, Users2, ShieldCheck } from 'lucide-react';

const features = [
  {
    icon: Kanban,
    title: 'Real-Time Kanban Workflows',
    description:
      'Organize deliverables with flexible custom stages, priority levels, due dates, tags, and drag-and-drop reordering.',
    color: 'text-primary-600 bg-primary-50 dark:bg-primary-950/60 dark:text-primary-400',
  },
  {
    icon: Zap,
    title: 'Instant WebSocket Sync',
    description:
      'Task status changes, column moves, and team discussions stream live to all active collaborators with zero latency.',
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400',
  },
  {
    icon: Users2,
    title: 'Centralized Team Coordination',
    description:
      'Multi-tenant workspace isolation with unified team directories, invitations, and seamless project assignments.',
    color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-400',
  },
  {
    icon: ShieldCheck,
    title: 'Granular Role Governance',
    description:
      'Enterprise-grade access control with distinct Owner, Admin, Member, and Viewer permissions per workspace and project.',
    color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400',
  },
];

export const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="py-20 bg-slate-50/60 dark:bg-slate-900/40 border-y border-slate-200/60 dark:border-slate-800">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
            Platform Capabilities
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl mt-1">
            Everything your team needs to deliver on time
          </h2>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            Engineered for clarity, speed, and dependable execution without bloated configuration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${item.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
