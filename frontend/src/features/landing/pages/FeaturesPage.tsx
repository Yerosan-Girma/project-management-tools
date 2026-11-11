import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Kanban,
  FolderGit2,
  CheckSquare,
  CalendarDays,
  Users,
  BarChart3,
  ArrowRight,
} from 'lucide-react';
import { PageHero } from '../components/PageHero';
import { FinalCtaSection } from '../components/FinalCtaSection';
import { Button } from '../../../components/ui/Button';
import { Card, CardContent } from '../../../components/ui/Card';
import { cn } from '../../../utils/cn';

const details = [
  {
    id: 'boards',
    icon: Kanban,
    title: 'Kanban boards',
    body: 'Every project gets a board with To Do, In Progress, Review, and Done. Rename columns, drag cards, and watch teammates see the move instantly.',
  },
  {
    id: 'projects',
    icon: FolderGit2,
    title: 'Projects',
    body: 'Create workspace projects with a short key (like MOB). Open a project to reach its board, members, and activity without leaving the app shell.',
  },
  {
    id: 'tasks',
    icon: CheckSquare,
    title: 'Tasks',
    body: 'Priority, due date, assignee, labels, and comments live on each card. My Tasks pulls everything assigned to you across projects.',
  },
  {
    id: 'calendar',
    icon: CalendarDays,
    title: 'Calendar',
    body: 'Deadlines from every project appear on a shared calendar so operations and product teams can plan the week without a separate tool.',
  },
  {
    id: 'team',
    icon: Users,
    title: 'Team & invitations',
    body: 'Invite by email, accept a token link, and land in the right workspace. Owners and admins control who can create projects or only view them.',
  },
  {
    id: 'analytics',
    icon: BarChart3,
    title: 'Analytics',
    body: 'Dashboard charts for velocity, status, and priority — the same components you already see after you sign in.',
  },
];

export const FeaturesPage: React.FC = () => {
  const location = useLocation();
  const [activeId, setActiveId] = useState('boards');
  const active = details.find((item) => item.id === activeId) ?? details[0];
  const Icon = active.icon;

  useEffect(() => {
    const hash = location.hash.replace('#', '');
    if (details.some((item) => item.id === hash)) {
      setActiveId(hash);
    }
  }, [location.hash]);

  return (
    <>
      <PageHero
        eyebrow="Features"
        title="Boards, tasks, calendar, and team — built as one product"
        description="These are the same modules in the TeamFlow dashboard. Use the list to inspect each surface before you create a workspace."
      />
      <section className="py-16">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 lg:grid-cols-[280px_1fr] sm:px-6 lg:px-8">
          <div className="space-y-2">
            {details.map((item) => (
              <a
                key={item.id}
                id={item.id}
                href={`#${item.id}`}
                onClick={() => setActiveId(item.id)}
                className={cn(
                  'block rounded-xl border px-4 py-3 text-sm font-semibold transition-colors',
                  activeId === item.id
                    ? 'border-primary-200 bg-primary-50 text-primary-700 dark:border-primary-800 dark:bg-primary-950/40 dark:text-primary-300'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                )}
              >
                {item.title}
              </a>
            ))}
          </div>
          <Card className="scroll-mt-24 rounded-2xl">
            <CardContent className="p-8">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-300">
                <Icon className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{active.title}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">{active.body}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/register">
                  <Button rightIcon={<ArrowRight className="h-4 w-4" />}>Try it in a workspace</Button>
                </Link>
                <Link to="/how-it-works">
                  <Button variant="outline">See how it works</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
      <FinalCtaSection />
    </>
  );
};

export default FeaturesPage;
