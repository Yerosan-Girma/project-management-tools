import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Kanban, Zap, Users2, ShieldCheck, CalendarDays, BarChart3, ArrowRight } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../utils/cn';

const features = [
  {
    id: 'boards',
    icon: Kanban,
    title: 'Real-time Kanban',
    description: 'Custom stages, priorities, due dates, labels, and drag-and-drop reordering that stay in sync for everyone.',
    color: 'text-primary-600 bg-primary-50 dark:bg-primary-950/60 dark:text-primary-400',
  },
  {
    id: 'sync',
    icon: Zap,
    title: 'Instant WebSocket sync',
    description: 'Task moves, comments, and invitations stream live so nobody works on a stale board.',
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400',
  },
  {
    id: 'team',
    icon: Users2,
    title: 'Team coordination',
    description: 'Invite members, assign projects, and keep each workspace isolated from the others.',
    color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-400',
  },
  {
    id: 'roles',
    icon: ShieldCheck,
    title: 'Role governance',
    description: 'Owner, Admin, Member, and Viewer permissions at workspace and project level.',
    color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400',
  },
  {
    id: 'calendar',
    icon: CalendarDays,
    title: 'Deadline calendar',
    description: 'See due dates across projects in one calendar instead of hunting through columns.',
    color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/60 dark:text-sky-400',
  },
  {
    id: 'analytics',
    icon: BarChart3,
    title: 'Sprint analytics',
    description: 'Velocity, status, and priority charts that match the dashboard your team already uses.',
    color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-400',
  },
];

export const FeaturesSection: React.FC = () => {
  const [activeId, setActiveId] = useState(features[0].id);
  const active = features.find((item) => item.id === activeId) ?? features[0];
  const ActiveIcon = active.icon;

  return (
    <section id="features" className="scroll-mt-20 border-y border-slate-200/60 bg-slate-50/60 py-20 dark:border-slate-800 dark:bg-slate-900/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
            Platform capabilities
          </span>
          <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            Everything your team needs to deliver on time
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((item) => {
            const Icon = item.icon;
            const selected = item.id === activeId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveId(item.id)}
                className={cn(
                  'rounded-2xl border p-6 text-left shadow-xs transition-all duration-200',
                  selected
                    ? 'border-primary-200 bg-white ring-2 ring-primary-500/20 dark:border-primary-800 dark:bg-slate-900'
                    : 'border-slate-200/80 bg-white hover:-translate-y-0.5 hover:shadow-md dark:border-slate-800 dark:bg-slate-900'
                )}
              >
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${item.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 text-base font-semibold text-slate-900 dark:text-white">{item.title}</h3>
                <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">{item.description}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${active.color}`}>
              <ActiveIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{active.title}</p>
              <p className="text-xs text-slate-500">Open the full feature map, including this area.</p>
            </div>
          </div>
          <Link to={`/features#${active.id === 'sync' ? 'boards' : active.id}`}>
            <Button size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
              View feature details
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
