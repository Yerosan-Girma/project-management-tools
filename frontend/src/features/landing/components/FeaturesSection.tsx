import React from 'react';
import {
  Kanban,
  Zap,
  ShieldCheck,
  BellRing,
  BarChart2,
  Users2,
  FolderGit2,
  MessageSquareText,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';

const features = [
  {
    icon: Kanban,
    title: 'Intuitive Kanban Workflows',
    description:
      'Organize deliverables with flexible custom columns, priorities, due dates, tags, and drag-and-drop reordering.',
    color: 'text-primary-600 bg-primary-50 dark:bg-primary-950/60 dark:text-primary-400',
  },
  {
    icon: Zap,
    title: 'Real-Time Live Synchronization',
    description:
      'Instantly see task updates, column movements, and comments without manual refreshes via native WebSockets.',
    color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400',
  },
  {
    icon: Users2,
    title: 'Multi-Tenant Workspaces',
    description:
      'Create dedicated workspaces for distinct organizations, teams, or client engagements with seamless switching.',
    color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 dark:text-indigo-400',
  },
  {
    icon: ShieldCheck,
    title: 'Role-Based Access Control',
    description:
      'Enforce security with distinct roles (Owner, Admin, Member, Viewer) and customized project membership permissions.',
    color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400',
  },
  {
    icon: MessageSquareText,
    title: 'Threaded Task Discussions',
    description:
      'Communicate contextually inside tasks with rich markdown notes, status updates, and actionable conversations.',
    color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/60 dark:text-sky-400',
  },
  {
    icon: BarChart2,
    title: 'Project Analytics & Velocity',
    description:
      'Visualize progress metrics, completion rates, priority distributions, and member workloads with interactive charts.',
    color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/60 dark:text-purple-400',
  },
  {
    icon: BellRing,
    title: 'Contextual In-App Alerts',
    description:
      'Stay informed when assigned to tasks, mentioned in discussions, or when critical project milestones change.',
    color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-400',
  },
  {
    icon: FolderGit2,
    title: 'Comprehensive Activity Log',
    description:
      'Maintain an unalterable audit trail tracking project creations, permission updates, and task reallocations.',
    color: 'text-teal-600 bg-teal-50 dark:bg-teal-950/60 dark:text-teal-400',
  },
];

export const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="py-20 bg-slate-50/60 dark:bg-slate-900/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 mb-2">
            Powerful Platform Capabilities
          </h2>
          <p className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Everything your team needs to deliver on time
          </p>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-400">
            Engineered for clarity, speed, and dependable execution from small sprint teams to enterprise organizations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((item, index) => {
            const Icon = item.icon;
            return (
              <Card key={index} hoverable className="border-slate-200/80 dark:border-slate-800">
                <CardHeader>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${item.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <CardTitle className="text-base font-semibold">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};
