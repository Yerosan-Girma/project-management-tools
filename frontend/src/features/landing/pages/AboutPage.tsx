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
  ChevronLeft,
  ChevronRight,
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
    badge: 'Leader & Founder',
    color: 'bg-amber-50 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300',
    description:
      'Creates the workspace. Has full control over team settings, projects, members, and organization details.',
    capabilities: [
      'Manage all workspace settings & billing',
      'Invite admins, developers, and client viewers',
      'Create, rename, or archive projects',
      'Exclusive authority to transfer or delete the workspace',
    ],
    preview: {
      headline: 'Full Workspace Governance Console',
      roleBadge: '👑 Owner Active View',
      summary: 'Overseeing team settings, member limits, and billing controls with full administrative authority.',
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
    badge: 'Project Manager',
    color: 'bg-primary-50 text-primary-700 dark:bg-primary-950/70 dark:text-primary-300',
    description:
      'Helps run the team. Can create new projects, invite new people, and organize columns and deadlines.',
    capabilities: [
      'Create and manage sprint projects',
      'Send verified email invitations with secure tokens',
      'Configure Kanban columns (To Do, In Progress, Review, Done)',
      'Assign tasks and milestone due dates to anyone on the team',
    ],
    preview: {
      headline: 'Project Creation & Member Invites',
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
    badge: 'Active Builder / Developer',
    color: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300',
    description:
      'The core team doing daily work. Can create tasks, drag cards to Done, post comments, and finish deliverables.',
    capabilities: [
      'Drag task cards smoothly across Kanban columns',
      'Add comments, labels, and deliverable attachments',
      'Update task completion status in real time via WebSockets',
      'Track all assigned tasks in the personal "My Tasks" queue',
    ],
    preview: {
      headline: 'Daily Sprint Task Execution',
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
    badge: 'Guest & Stakeholder',
    color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    description:
      'Perfect for clients and guests. They can see the board, check progress, and view deadlines without accidentally changing anything.',
    capabilities: [
      'View Kanban boards and active sprint cards in read-only mode',
      'Check deadline calendars and delivery milestones',
      'Inspect project deliverables with 100% transparency',
      'Zero risk of breaking tasks, modifying columns, or deleting work',
    ],
    preview: {
      headline: 'Transparent Read-Only Stakeholder Review',
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
      actionTitle: 'Go to Dashboard',
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
      actionTitle: 'Explore Projects & Boards',
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
      actionTitle: 'Open My Tasks',
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
      sub: 'Alpha Release target scheduled for Friday',
      actionTitle: 'View Milestone Calendar',
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
      actionTitle: 'Manage Team & Access',
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
      actionTitle: 'Open Workspaces Manager',
    },
  },
];

export const AboutPage: React.FC = () => {
  // AUTO-PLAY: DISPLAY ROLES ONE BY ONE (HIDES ALL OTHERS)
  const [activeRoleIndex, setActiveRoleIndex] = useState(0);
  const [roleProgress, setRoleProgress] = useState(0);
  const [isRolePaused, setIsRolePaused] = useState(false);

  useEffect(() => {
    if (isRolePaused) return;
    const interval = setInterval(() => {
      setRoleProgress((prev) => {
        if (prev >= 100) {
          setActiveRoleIndex((current) => (current + 1) % roles.length);
          return 0;
        }
        return prev + 2.5; // 4000ms duration (4 seconds per card)
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isRolePaused]);

  const handleSelectRole = (idx: number) => {
    setActiveRoleIndex(idx);
    setRoleProgress(0);
  };

  const handlePrevRole = () => {
    setActiveRoleIndex((prev) => (prev === 0 ? roles.length - 1 : prev - 1));
    setRoleProgress(0);
  };

  const handleNextRole = () => {
    setActiveRoleIndex((prev) => (prev + 1) % roles.length);
    setRoleProgress(0);
  };

  // AUTO-PLAY: DISPLAY PAGES ONE BY ONE (HIDES ALL OTHERS)
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [pageProgress, setPageProgress] = useState(0);
  const [isPagePaused, setIsPagePaused] = useState(false);

  useEffect(() => {
    if (isPagePaused) return;
    const interval = setInterval(() => {
      setPageProgress((prev) => {
        if (prev >= 100) {
          setActivePageIndex((current) => (current + 1) % platformPages.length);
          return 0;
        }
        return prev + 2.5; // 4000ms duration (4 seconds per card)
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isPagePaused]);

  const handleSelectPage = (idx: number) => {
    setActivePageIndex(idx);
    setPageProgress(0);
  };

  const handlePrevPage = () => {
    setActivePageIndex((prev) => (prev === 0 ? platformPages.length - 1 : prev - 1));
    setPageProgress(0);
  };

  const handleNextPage = () => {
    setActivePageIndex((prev) => (prev + 1) % platformPages.length);
    setPageProgress(0);
  };

  const currentRole = roles[activeRoleIndex];
  const CurrentRoleIcon = currentRole.icon;

  const currentPage = platformPages[activePageIndex];
  const CurrentPageIcon = currentPage.icon;

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

      {/* SECTION 2: DISPLAY ROLES ONE BY ONE (OTHER ROLES HIDDEN) */}
      <section className="border-y border-slate-200/70 bg-slate-50/60 py-20 dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-3.5 py-1 text-xs font-semibold text-primary-700 dark:border-primary-800 dark:bg-primary-950/60 dark:text-primary-300">
              <span className="relative flex h-2 w-2">
                <span className={cn('absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75', !isRolePaused && 'animate-ping')} />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-600" />
              </span>
              <span>
                {isRolePaused ? 'Animation Paused' : `Displaying 1 by 1 automatically (Card ${activeRoleIndex + 1} of ${roles.length})`}
              </span>
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              Team roles explained — one by one
            </h2>
            <p className="mt-3 text-sm text-slate-600 sm:text-base dark:text-slate-400">
              Each role card is shown below individually. It automatically advances every 4 seconds, or you can use the arrows to switch.
            </p>
          </div>

          {/* Navigation Bar for Roles */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary-600 px-3 py-1 text-xs font-bold text-white shadow-xs">
                Role {activeRoleIndex + 1} of {roles.length}
              </span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {currentRole.name}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Dots indicator */}
              <div className="flex items-center gap-1.5">
                {roles.map((r, idx) => (
                  <button
                    key={r.name}
                    type="button"
                    onClick={() => handleSelectRole(idx)}
                    className={cn(
                      'h-2.5 rounded-full transition-all duration-300',
                      activeRoleIndex === idx
                        ? 'w-7 bg-primary-600'
                        : 'w-2.5 bg-slate-300 hover:bg-slate-400 dark:bg-slate-700'
                    )}
                    aria-label={`Show ${r.name}`}
                    title={r.name}
                  />
                ))}
              </div>

              {/* Pause/Play toggle */}
              <button
                type="button"
                onClick={() => setIsRolePaused((p) => !p)}
                className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                title={isRolePaused ? 'Resume auto-display' : 'Pause on current card'}
                aria-label={isRolePaused ? 'Resume' : 'Pause'}
              >
                {isRolePaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
              </button>

              {/* Previous / Next buttons */}
              <div className="inline-flex rounded-full border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
                <button
                  type="button"
                  onClick={handlePrevRole}
                  className="rounded-l-full p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  aria-label="Previous role card"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextRole}
                  className="rounded-r-full p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  aria-label="Next role card"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* SINGLE ACTIVE ROLE CARD (ALL OTHER 3 CARDS HIDDEN) */}
          <div
            key={`role-card-${activeRoleIndex}`}
            onMouseEnter={() => setIsRolePaused(true)}
            onMouseLeave={() => setIsRolePaused(false)}
            className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xl transition-all duration-500 sm:p-10 dark:border-slate-800 dark:bg-slate-900"
          >
            {/* Auto-advancing Top Progress Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full bg-primary-600 transition-all duration-100 ease-linear"
                style={{ width: `${roleProgress}%` }}
              />
            </div>

            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              {/* Left Column: Role Overview & Permissions */}
              <div>
                <div className="flex items-center gap-3">
                  <div className={cn('flex h-12 w-12 items-center justify-center rounded-2xl shadow-xs', currentRole.color)}>
                    <CurrentRoleIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-[11px] font-bold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                      {currentRole.badge}
                    </span>
                    <h3 className="mt-1 text-2xl font-black text-slate-900 dark:text-white">
                      {currentRole.name}
                    </h3>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300">
                  {currentRole.description}
                </p>

                <div className="mt-6 space-y-2.5 border-t border-slate-100 pt-5 dark:border-slate-800">
                  <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    What this role can do:
                  </span>
                  {currentRole.capabilities.map((cap, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300 sm:text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span>{cap}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Live Simulated Role Screen */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-5 shadow-xs dark:border-slate-800/80 dark:bg-slate-950/60">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-3 dark:border-slate-800">
                  <div>
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                      Live Screen Simulation
                    </span>
                    <span className="block text-sm font-semibold text-slate-900 dark:text-white">
                      {currentRole.preview.headline}
                    </span>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-slate-700 shadow-2xs dark:bg-slate-900 dark:text-slate-300">
                    {currentRole.preview.roleBadge}
                  </span>
                </div>

                <div className="mt-4 space-y-2.5">
                  {currentRole.preview.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl bg-white p-3 text-xs shadow-2xs dark:bg-slate-900"
                    >
                      <div>
                        <span className="block text-slate-500 text-[11px]">{item.label}</span>
                        <span className="block font-semibold text-slate-900 dark:text-white mt-0.5">{item.value}</span>
                      </div>
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="mt-4 text-[11px] text-slate-500 italic">
                  {currentRole.preview.summary}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: DISPLAY PLATFORM PAGES ONE BY ONE (OTHER PAGES HIDDEN) */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto mb-10 max-w-3xl text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3.5 py-1 text-xs font-semibold text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">
              <span className="relative flex h-2 w-2">
                <span className={cn('absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75', !isPagePaused && 'animate-ping')} />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-600" />
              </span>
              <span>
                {isPagePaused ? 'Animation Paused' : `Displaying 1 by 1 automatically (Page ${activePageIndex + 1} of ${platformPages.length})`}
              </span>
            </div>

            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              Platform pages guide — one by one
            </h2>
            <p className="mt-3 text-sm text-slate-600 sm:text-base dark:text-slate-400">
              Learn what every page in TeamFlow does. Each card displays on its own and auto-advances.
            </p>
          </div>

          {/* Navigation Bar for Pages */}
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-indigo-600 px-3 py-1 text-xs font-bold text-white shadow-xs">
                Page {activePageIndex + 1} of {platformPages.length}
              </span>
              <span className="font-mono text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                {currentPage.path}
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Dots indicator */}
              <div className="flex items-center gap-1.5">
                {platformPages.map((p, idx) => (
                  <button
                    key={p.title}
                    type="button"
                    onClick={() => handleSelectPage(idx)}
                    className={cn(
                      'h-2.5 rounded-full transition-all duration-300',
                      activePageIndex === idx
                        ? 'w-7 bg-indigo-600'
                        : 'w-2.5 bg-slate-300 hover:bg-slate-400 dark:bg-slate-700'
                    )}
                    aria-label={`Show ${p.title}`}
                    title={p.title}
                  />
                ))}
              </div>

              {/* Pause/Play toggle */}
              <button
                type="button"
                onClick={() => setIsPagePaused((p) => !p)}
                className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                title={isPagePaused ? 'Resume auto-display' : 'Pause on current card'}
                aria-label={isPagePaused ? 'Resume' : 'Pause'}
              >
                {isPagePaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
              </button>

              {/* Previous / Next buttons */}
              <div className="inline-flex rounded-full border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-2xs">
                <button
                  type="button"
                  onClick={handlePrevPage}
                  className="rounded-l-full p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  aria-label="Previous page card"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextPage}
                  className="rounded-r-full p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                  aria-label="Next page card"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* SINGLE ACTIVE PAGE CARD (ALL OTHER 5 CARDS HIDDEN) */}
          <div
            key={`page-card-${activePageIndex}`}
            onMouseEnter={() => setIsPagePaused(true)}
            onMouseLeave={() => setIsPagePaused(false)}
            className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-2xl transition-all duration-500 sm:p-10 dark:border-slate-800 dark:bg-slate-900"
          >
            {/* Auto-advancing Top Progress Bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full bg-indigo-600 transition-all duration-100 ease-linear"
                style={{ width: `${pageProgress}%` }}
              />
            </div>

            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              {/* Left Column: Page Detail */}
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-xs dark:bg-indigo-950/80 dark:text-indigo-300">
                    <CurrentPageIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {currentPage.path}
                    </span>
                    <h3 className="mt-0.5 text-2xl font-black text-slate-900 dark:text-white">
                      {currentPage.title}
                    </h3>
                  </div>
                </div>

                <p className="mt-4 text-sm leading-relaxed text-slate-600 sm:text-base dark:text-slate-300">
                  {currentPage.simpleExplain}
                </p>

                <div className="mt-8 flex items-center gap-3">
                  <Link to={currentPage.path}>
                    <Button size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                      {currentPage.mock.actionTitle}
                    </Button>
                  </Link>
                  <span className="text-xs text-slate-400">
                    Direct workspace link
                  </span>
                </div>
              </div>

              {/* Right Column: Live Mock Widget Display */}
              <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-purple-50/40 p-6 shadow-xs dark:border-indigo-950 dark:bg-gradient-to-br dark:from-slate-950/70 dark:to-slate-900">
                <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                  {currentPage.mock.tag}
                </span>

                <h4 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
                  {currentPage.mock.headline}
                </h4>

                <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400 sm:text-sm">
                  {currentPage.mock.sub}
                </p>

                <div className="mt-6 flex items-center justify-between border-t border-indigo-200/50 pt-4 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                    Active Module
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Auto-switching in 4s
                  </span>
                </div>
              </div>
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
