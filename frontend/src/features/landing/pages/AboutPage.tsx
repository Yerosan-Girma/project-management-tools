import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Kanban,
  CheckCircle2,
  Calendar,
  Layers,
  Shield,
  ArrowRight,
  Sparkles,
  LayoutDashboard,
  CheckSquare,
  Eye,
  Crown,
  Play,
  Pause,
} from 'lucide-react';
import { PageHero } from '../components/PageHero';
import { FinalCtaSection } from '../components/FinalCtaSection';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../utils/cn';

const roles = [
  {
    icon: Crown,
    name: 'Workspace Owner',
    badge: 'Leader',
    color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300',
    description:
      'Creates the workspace. Has full control over team settings, projects, members, and organization details.',
    capabilities: ['Manage all workspace settings', 'Invite admins and members', 'Delete or rename projects'],
    preview: {
      headline: 'Full Workspace Governance',
      roleBadge: '👑 Owner Active View',
      summary: 'Overseeing team settings, member limits, and billing controls with full authority.',
      items: [
        { label: 'Workspace Name', value: 'TeamFlow Core Engine', status: 'Active' },
        { label: 'Multi-Tenant Isolation', value: 'PostgreSQL Tenant UUID-71a', status: 'Secured' },
        { label: 'Member Limit', value: '25 Active Seats (4 used)', status: 'Optimal' },
      ],
    },
  },
  {
    icon: Shield,
    name: 'Workspace Admin',
    badge: 'Manager',
    color: 'bg-primary-50 text-primary-700 dark:bg-primary-950/70 dark:text-primary-300',
    description:
      'Helps run the team. Can create new projects, invite new people, and organize columns and deadlines.',
    capabilities: ['Create and manage projects', 'Send email invitations', 'Assign tasks to anyone'],
    preview: {
      headline: 'Project Creation & Invites',
      roleBadge: '🛡️ Admin Active View',
      summary: 'Managing project repositories, inviting new teammates, and setting up sprint columns.',
      items: [
        { label: 'Project Prefix', value: 'ENG (Engineering Sprint)', status: 'Active' },
        { label: 'Pending Invite', value: 'gemachu@teamflow.local (Member)', status: 'Sent' },
        { label: 'Board Workflow', value: 'To Do • In Progress • Review • Done', status: 'Configured' },
      ],
    },
  },
  {
    icon: Users,
    name: 'Team Member',
    badge: 'Builder',
    color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300',
    description:
      'The core team doing daily work. Can create tasks, drag cards to Done, post comments, and finish deliverables.',
    capabilities: ['Drag cards across columns', 'Add comments and labels', 'Complete assigned tasks'],
    preview: {
      headline: 'Daily Task Execution',
      roleBadge: '💻 Member Active View',
      summary: 'Active hands-on delivery. Moving cards forward, writing comments, and shipping sprint tasks.',
      items: [
        { label: 'ENG-108', value: 'OAuth 2.0 PKCE authentication hook', status: 'In Progress' },
        { label: 'ENG-94', value: 'Multi-tenant schema validation', status: 'Review' },
        { label: 'ENG-82', value: 'SMTP email invitation dispatch', status: 'Done' },
      ],
    },
  },
  {
    icon: Eye,
    name: 'Viewer / Client',
    badge: 'Guest',
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    description:
      'Perfect for clients and guests. They can see the board, check progress, and view deadlines without accidentally changing anything.',
    capabilities: ['View boards in read-only mode', 'Check milestone deadlines', 'Zero risk of breaking tasks'],
    preview: {
      headline: 'Transparent Read-Only Review',
      roleBadge: '👁️ Viewer Safe View',
      summary: 'Safe stakeholder view. Can inspect deliverable deadlines and progress with zero edit risks.',
      items: [
        { label: 'Sprint Status', value: 'Sprint 14 • 85% Completed', status: 'On Track' },
        { label: 'Delivery Target', value: 'Friday at 5:00 PM UTC', status: 'Scheduled' },
        { label: 'Edit Permissions', value: 'Locked (Zero risk of accidental card deletion)', status: 'Protected' },
      ],
    },
  },
];

const platformPages = [
  {
    icon: LayoutDashboard,
    title: 'Dashboard Page',
    path: '/dashboard',
    simpleExplain:
      'Your main headquarters. Shows high-level project progress, team statistics, and what everyone is currently working on.',
    mock: {
      tag: 'Headquarters',
      headline: 'Sprint 14 Velocity: 54 story points',
      sub: '4 Active Projects • 0 Blockers • 98.4% on-time pace',
    },
  },
  {
    icon: Kanban,
    title: 'Projects & Boards Page',
    path: '/projects',
    simpleExplain:
      'Visual Kanban boards with columns (To Do, In Progress, Review, Done). Drag cards forward as work gets finished.',
    mock: {
      tag: 'Kanban Flow',
      headline: 'Live Board: Mobile Application (MOB)',
      sub: 'To Do (4) • In Progress (2) • Review (1) • Done (5)',
    },
  },
  {
    icon: CheckSquare,
    title: 'My Tasks Page',
    path: '/my-tasks',
    simpleExplain:
      'Your personal to-do list. Brings together all tasks assigned directly to you across all projects into one tidy list.',
    mock: {
      tag: 'Personal Queue',
      headline: '6 tasks assigned to you across 2 projects',
      sub: 'Next deliverable due tomorrow at 3:00 PM',
    },
  },
  {
    icon: Calendar,
    title: 'Calendar Page',
    path: '/calendar',
    simpleExplain:
      'A shared team calendar that puts all deadlines on a monthly schedule so no delivery dates are forgotten.',
    mock: {
      tag: 'Milestone Timeline',
      headline: 'Cross-project deadline aggregation',
      sub: 'Alpha Release target highlighted for Friday',
    },
  },
  {
    icon: Users,
    title: 'Team & Members Page',
    path: '/team',
    simpleExplain:
      'See everyone in your workspace. Send email invitations to new teammates and set their role with one click.',
    mock: {
      tag: 'Member Directory',
      headline: '4 Active Members • 1 Pending Invite',
      sub: 'Instant SMTP token dispatch via verified email',
    },
  },
  {
    icon: Layers,
    title: 'Workspaces Manager',
    path: '/workspaces',
    simpleExplain:
      'Allows you to switch between different companies, departments, or client workspaces without logging out.',
    mock: {
      tag: 'Multi-Tenant Hub',
      headline: 'Engineering Squad • Client Alpha Workspace',
      sub: 'Strict data partitioning with zero cross-tenant leakage',
    },
  },
];

export const AboutPage: React.FC = () => {
  // AUTO-PLAY ANIMATION FOR ROLE CARDS
  const [activeRoleIndex, setActiveRoleIndex] = useState(0);
  const [isRolePaused, setIsRolePaused] = useState(false);

  useEffect(() => {
    if (isRolePaused) return;
    const interval = setInterval(() => {
      setActiveRoleIndex((prev) => (prev + 1) % roles.length);
    }, 3600);
    return () => clearInterval(interval);
  }, [isRolePaused]);

  // AUTO-PLAY ANIMATION FOR PAGES CARDS
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [isPagePaused, setIsPagePaused] = useState(false);

  useEffect(() => {
    if (isPagePaused) return;
    const interval = setInterval(() => {
      setActivePageIndex((prev) => (prev + 1) % platformPages.length);
    }, 3200);
    return () => clearInterval(interval);
  }, [isPagePaused]);

  const activeRole = roles[activeRoleIndex];
  const ActiveRoleIcon = activeRole.icon;
  const activePage = platformPages[activePageIndex];

  return (
    <>
      <PageHero
        eyebrow="About TeamFlow"
        title="Simple, role-based project management for everyone"
        description="TeamFlow is designed to help teams work together easily. Everyone knows what to do, who owns it, and when it is due — with clear, safe roles for every team member."
      />

      {/* SECTION 1: What is TeamFlow in simple words */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200/90 bg-gradient-to-br from-white via-slate-50/50 to-primary-50/30 p-8 shadow-sm sm:p-12 dark:border-slate-800 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary-100/80 px-3.5 py-1 text-xs font-bold text-primary-800 dark:bg-primary-950 dark:text-primary-300">
              <Sparkles className="h-3.5 w-3.5" />
              <span>What is this platform?</span>
            </div>
            <h2 className="mt-4 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              A shared workspace where teams get things done together
            </h2>
            <div className="mt-4 space-y-4 text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300">
              <p>
                When teams work together without a shared platform, tasks get lost in messy chat channels, forgotten in long email threads, or duplicated across spreadsheets.
              </p>
              <p>
                <strong>TeamFlow solves this simply:</strong> We give your team a digital board where every task is a card. You can assign tasks to teammates, set due dates, add comments, and move cards from <em>To Do</em> to <em>In Progress</em> to <em>Done</em>.
              </p>
              <p>
                When any teammate moves a card, everyone else sees it update on their screen instantly — no page refreshing needed!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: AUTO-ANIMATING ROLE CARDS */}
      <section className="border-y border-slate-200/70 bg-slate-50/60 py-20 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-3.5 py-1 text-xs font-semibold text-primary-700 dark:border-primary-800 dark:bg-primary-950/60 dark:text-primary-300">
              <span className="relative flex h-2 w-2">
                <span className={cn('absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75', !isRolePaused && 'animate-ping')} />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-600" />
              </span>
              <span>{isRolePaused ? 'Animation Paused (Hovering)' : 'Self-Playing Role Showcase (Auto-Cycling)'}</span>
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              Safe collaboration with the right role for everyone
            </h2>
            <p className="mt-3 text-sm text-slate-600 sm:text-base dark:text-slate-400">
              Watch the cards below cycle automatically to see what each team role can do. Hover with your mouse to pause.
            </p>

            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => setIsRolePaused((p) => !p)}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-2xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              >
                {isRolePaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
                <span>{isRolePaused ? 'Resume auto-play' : 'Pause animation'}</span>
              </button>
            </div>
          </div>

          {/* 4 Auto-animating Cards Grid */}
          <div
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
            onMouseEnter={() => setIsRolePaused(true)}
            onMouseLeave={() => setIsRolePaused(false)}
          >
            {roles.map((r, index) => {
              const Icon = r.icon;
              const isSelected = activeRoleIndex === index;
              return (
                <div
                  key={r.name}
                  onClick={() => setActiveRoleIndex(index)}
                  className={cn(
                    'group relative cursor-pointer flex flex-col justify-between rounded-3xl border bg-white p-6 transition-all duration-500 dark:bg-slate-900',
                    isSelected
                      ? 'border-primary-500 shadow-2xl ring-2 ring-primary-500/25 scale-[1.02] dark:border-primary-600'
                      : 'border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-md dark:border-slate-800'
                  )}
                >
                  {/* Active Card Progress Line Animation */}
                  {isSelected && (
                    <div className="absolute top-0 left-6 right-6 h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-full bg-primary-600 animate-[pulse_2s_ease-in-out_infinite]" />
                    </div>
                  )}

                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <div
                        className={cn(
                          'flex h-11 w-11 items-center justify-center rounded-2xl transition-transform duration-300',
                          r.color,
                          isSelected && 'scale-110'
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isSelected && (
                          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-0.5 text-[10px] font-bold transition-colors',
                            isSelected
                              ? 'bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                          )}
                        >
                          {r.badge}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center justify-between">
                      <span>{r.name}</span>
                      {isSelected && (
                        <span className="text-[10px] font-bold text-primary-600 dark:text-primary-400">
                          Active
                        </span>
                      )}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                      {r.description}
                    </p>

                    <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                      {r.capabilities.map((cap, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300">
                          <CheckCircle2
                            className={cn(
                              'mt-0.5 h-3.5 w-3.5 shrink-0 transition-colors',
                              isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-emerald-600 dark:text-emerald-400'
                            )}
                          />
                          <span>{cap}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dynamic Active Role Live Showcase Display */}
          <div className="mt-10 overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xl sm:p-8 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className={cn('flex h-11 w-11 items-center justify-center rounded-2xl', activeRole.color)}>
                  <ActiveRoleIcon className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                      Live Role Simulation
                    </span>
                    <span className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-bold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                      {activeRole.preview.roleBadge}
                    </span>
                  </div>
                  <h3 className="mt-0.5 text-lg font-bold text-slate-900 dark:text-white">
                    {activeRole.preview.headline}
                  </h3>
                </div>
              </div>

              <span className="text-xs text-slate-500 max-w-sm">
                {activeRole.preview.summary}
              </span>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {activeRole.preview.items.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition-all hover:bg-slate-100/70 dark:border-slate-800/80 dark:bg-slate-950/60 dark:hover:bg-slate-800/60"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>{item.label}</span>
                    <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-bold text-slate-900 dark:text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: AUTO-ANIMATING PLATFORM PAGES GUIDE */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
              <span className="relative flex h-2 w-2">
                <span className={cn('absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75', !isPagePaused && 'animate-ping')} />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-600" />
              </span>
              <span>{isPagePaused ? 'Animation Paused' : 'Pages Spotlight (Auto-Rotating)'}</span>
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              What does each page do?
            </h2>
            <p className="mt-3 text-sm text-slate-600 sm:text-base dark:text-slate-400">
              The cards below cycle automatically to guide you through every view of the application.
            </p>
          </div>

          <div
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            onMouseEnter={() => setIsPagePaused(true)}
            onMouseLeave={() => setIsPagePaused(false)}
          >
            {platformPages.map((page, index) => {
              const Icon = page.icon;
              const isSelected = activePageIndex === index;
              return (
                <div
                  key={page.title}
                  onClick={() => setActivePageIndex(index)}
                  className={cn(
                    'group relative cursor-pointer rounded-3xl border bg-white p-6 transition-all duration-500 dark:bg-slate-900',
                    isSelected
                      ? 'border-indigo-500 shadow-xl ring-2 ring-indigo-500/25 scale-[1.02] dark:border-indigo-600'
                      : 'border-slate-200/90 shadow-xs hover:border-slate-300 hover:shadow-md dark:border-slate-800'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={cn(
                        'flex h-11 w-11 items-center justify-center rounded-2xl transition-colors',
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-primary-50 text-primary-600 dark:bg-primary-950/80 dark:text-primary-300'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <span
                      className={cn(
                        'font-mono text-[11px] font-bold rounded-full px-2.5 py-0.5',
                        isSelected
                          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                      )}
                    >
                      {page.path}
                    </span>
                  </div>

                  <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white flex items-center justify-between">
                    <span>{page.title}</span>
                    {isSelected && (
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                        In Spotlight
                      </span>
                    )}
                  </h3>

                  <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400 sm:text-sm">
                    {page.simpleExplain}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Active Page Live UI Spotlight Card */}
          <div className="mt-8 rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50/60 via-white to-purple-50/40 p-6 sm:p-8 dark:border-indigo-950 dark:bg-gradient-to-r dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  {activePage.mock.tag}
                </span>
                <h4 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                  {activePage.mock.headline}
                </h4>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  {activePage.mock.sub}
                </p>
              </div>

              <Link to={activePage.path}>
                <Button size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Open {activePage.title}
                </Button>
              </Link>
            </div>
          </div>

          {/* Quick Start Bottom Box */}
          <div className="mt-14 rounded-3xl border border-primary-200/80 bg-primary-50/50 p-8 text-center sm:p-10 dark:border-primary-900/60 dark:bg-primary-950/30">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Ready to work with your team?
            </h3>
            <p className="mx-auto mt-2 max-w-xl text-xs text-slate-600 dark:text-slate-300 sm:text-sm">
              Create your workspace in seconds, invite your teammates by email, and start delivering on live Kanban boards.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/register">
                <Button size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Create free workspace
                </Button>
              </Link>
              <Link to="/features">
                <Button size="sm" variant="outline">
                  Explore all features
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

export default AboutPage;
