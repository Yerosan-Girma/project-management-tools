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
  CheckCircle2,
} from 'lucide-react';
import { PageHero } from '../components/PageHero';
import { FinalCtaSection } from '../components/FinalCtaSection';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../utils/cn';

const details = [
  {
    id: 'boards',
    icon: Kanban,
    title: 'Kanban boards',
    lead: 'Visual sprint flow with custom columns and drag-and-drop mechanics.',
    body: 'Every project comes with standard stages (To Do, In Progress, Review, and Done) that you can rename, reorder, or customize. Real-time WebSockets ensure every card drag is instantly mirrored to all connected teammates without page reloads.',
    highlights: [
      'Zero-latency drag-and-drop reordering',
      'Configurable stage limits and custom columns',
      'Task issue keys and color-coded priority badges',
      'Real-time WebSocket event synchronization',
    ],
  },
  {
    id: 'projects',
    icon: FolderGit2,
    title: 'Projects',
    lead: 'Scoped sprint repositories with issue identifiers and member directories.',
    body: 'Create workspace projects with a custom project key (such as ENG or MOB). Open a project to manage its board, issue backlog, assigned members, and milestone activity within an isolated multi-tenant boundary.',
    highlights: [
      'Automated issue key prefix generation',
      'Dedicated project member registries',
      'Project-level role permissions (Manager vs Member vs Viewer)',
      'Independent Kanban boards per project',
    ],
  },
  {
    id: 'tasks',
    icon: CheckSquare,
    title: 'Tasks & sub-deliverables',
    lead: 'Granular prioritization, deadlines, assignees, and real-time commentary.',
    body: 'Assign issues to teammates, set hard milestone due dates, attach custom labels, and collaborate in markdown comments. The personal "My Tasks" queue consolidates all work assigned to you across every active project.',
    highlights: [
      'Priority tiers: Urgent, High, Medium, and Low',
      'Personal cross-project "My Tasks" view',
      'Markdown-enabled comment streams',
      'Dynamic status transitions and activity logs',
    ],
  },
  {
    id: 'calendar',
    icon: CalendarDays,
    title: 'Milestone calendar',
    lead: 'Unified cross-project timeline tracking upcoming deliverable dates.',
    body: 'View task deadlines across all projects in a single calendar view. Operations, managers, and product leads can inspect upcoming milestone pressures without clicking through separate column views.',
    highlights: [
      'Cross-project deadline aggregation',
      'Interactive month and week schedule views',
      'Automated upcoming deadline background notifications',
      'Direct card access from calendar dates',
    ],
  },
  {
    id: 'team',
    icon: Users,
    title: 'Team & invitations',
    lead: 'Granular access control and cryptographically signed email invitations.',
    body: 'Invite collaborators by email with pre-assigned roles. Team members accept via secure one-time tokens and immediately land inside the authorized workspace with strict tenant boundary enforcement.',
    highlights: [
      'Verified SMTP invitation dispatch with 7-day secure tokens',
      'Role tiers: Platform Admin, Owner, Admin, Member, and Viewer',
      'In-app invitation notification for existing users',
      'Instant membership revocation and access modification',
    ],
  },
  {
    id: 'analytics',
    icon: BarChart3,
    title: 'Sprint analytics',
    lead: 'Velocity metrics, completion status distributions, and team performance.',
    body: 'Evaluate active sprint health with real-time analytics. Visual velocity charts, status distributions, and priority breakdowns give team leads data-driven visibility into delivery pace.',
    highlights: [
      'Sprint velocity and story point progress tracking',
      'Task status and priority distribution charts',
      'Member delivery volume and contribution metrics',
      'Instant dashboard aggregation without background delays',
    ],
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
        eyebrow="Feature Explorer"
        title="Boards, tasks, calendar, and governance"
        description="Inspect the architectural modules that power TeamFlow workspaces. Every feature is built for high performance and zero dashboard clutter."
      />

      <section className="py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 lg:grid-cols-[300px_1fr] sm:px-6 lg:px-8">
          {/* Left Feature Navigator */}
          <div className="space-y-2">
            {details.map((item) => {
              const ItemIcon = item.icon;
              const isSelected = activeId === item.id;
              return (
                <a
                  key={item.id}
                  id={item.id}
                  href={`#${item.id}`}
                  onClick={() => setActiveId(item.id)}
                  className={cn(
                    'flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-sm font-semibold transition-all',
                    isSelected
                      ? 'border-primary-500 bg-primary-50 text-primary-700 shadow-xs dark:border-primary-700 dark:bg-primary-950/40 dark:text-primary-300'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                  )}
                >
                  <ItemIcon className={cn('h-4 w-4', isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400')} />
                  <span>{item.title}</span>
                </a>
              );
            })}
          </div>

          {/* Right: Rich Feature Studio Display */}
          <div className="rounded-3xl border border-slate-200/90 bg-gradient-to-br from-slate-50/50 via-white to-slate-50/80 p-8 shadow-xl sm:p-10 dark:border-slate-800 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600 dark:bg-primary-950/80 dark:text-primary-300">
              <Icon className="h-6 w-6" />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-primary-100 px-2 py-0.5 text-[10px] font-bold text-primary-800 dark:bg-primary-950 dark:text-primary-300">
                Core Capability
              </span>
              <span className="text-xs text-slate-400">• Real-Time Architecture</span>
            </div>

            <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              {active.title}
            </h2>
            <p className="mt-2 text-base font-semibold text-primary-700 dark:text-primary-300">
              {active.lead}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300 sm:text-base">
              {active.body}
            </p>

            {/* Highlights Grid */}
            <div className="mt-8 border-t border-slate-100 pt-6 dark:border-slate-800">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Key Technical Features
              </h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {active.highlights.map((h, i) => (
                  <div key={i} className="flex items-start gap-2.5 rounded-xl border border-slate-100 bg-white p-3 text-xs shadow-2xs dark:border-slate-800/80 dark:bg-slate-900">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-medium text-slate-800 dark:text-slate-200">{h}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link to="/register">
                <Button rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Test in live workspace
                </Button>
              </Link>
              <Link to="/how-it-works">
                <Button variant="outline">
                  See workflow walkthrough
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <FinalCtaSection />
    </>
  );
};

export default FeaturesPage;
