import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Kanban,
  Rocket,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../utils/cn';

interface PreviewItem {
  label: string;
  desc: string;
  tag: string;
  tagType?: 'primary' | 'indigo' | 'emerald';
}

const steps = [
  {
    step: '01',
    id: 'setup',
    title: 'Workspace Setup & Access',
    subtitle: 'Isolated multi-tenant container in seconds',
    icon: Building2,
    details: [
      'Create your team or client workspace with dedicated PostgreSQL isolation',
      'Invite team members by email with granular roles (Admin, Member, Viewer)',
      'Manage multiple client projects without cross-tenant data leakage',
    ],
    preview: {
      badge: 'Step 1 • Initial Setup',
      headline: 'TeamFlow Core Workspace',
      meta: 'Multi-Tenant Isolation • Role Governance',
      items: [
        { label: 'Platform Admin', desc: 'Yerosan Girma (Oversees platform)', tag: 'PLATFORM_ADMIN', tagType: 'primary' },
        { label: 'Project Owner', desc: 'Yoni Tola (Manages sprint backlog)', tag: 'OWNER', tagType: 'primary' },
        { label: 'Developer', desc: 'Gemachu (Executes sprint deliverables)', tag: 'MEMBER', tagType: 'indigo' },
        { label: 'Guest / Client', desc: 'Tesfaye (Read-only stakeholder review)', tag: 'VIEWER', tagType: 'emerald' },
      ] as PreviewItem[],
    },
  },
  {
    step: '02',
    id: 'board',
    title: 'Sprint Kanban & Tasks',
    subtitle: 'Drag-and-drop workflow with issue tracking',
    icon: Kanban,
    details: [
      'Organize work across To Do, In Progress, Code Review, and Done columns',
      'Assign task priority, due dates, custom labels, and markdown comments',
      'Inspect task details without navigating away from the sprint board',
    ],
    preview: {
      badge: 'Step 2 • Sprint Flow',
      headline: 'Sprint 14 Kanban Delivery',
      meta: 'Active Sprint • 18 issues tracking',
      items: [
        { label: 'To Do', desc: 'ENG-112: Cloud storage attachment pipeline', tag: 'Backlog', tagType: 'indigo' },
        { label: 'In Progress', desc: 'ENG-108: Multi-factor authentication hook', tag: 'Active', tagType: 'primary' },
        { label: 'Review', desc: 'ENG-104: Offline SQLite state reconciliation', tag: 'Peer Review', tagType: 'indigo' },
        { label: 'Done', desc: 'ENG-98: Instant email invitation dispatch', tag: 'Shipped', tagType: 'emerald' },
      ] as PreviewItem[],
    },
  },
  {
    step: '03',
    id: 'ship',
    title: 'Real-Time Sync & Delivery',
    subtitle: 'Zero refresh latency, live updates, and calendar',
    icon: Rocket,
    details: [
      'WebSocket event bus delivers moves, comments, and invites instantly',
      'Cross-project calendar tracks milestone deadlines in one place',
      'Velocity and completion metrics automatically aggregate for the team',
    ],
    preview: {
      badge: 'Step 3 • Milestone Velocity',
      headline: 'Live Synchronization Engine',
      meta: 'WebSocket Connected • <15ms Latency',
      items: [
        { label: 'WebSocket Bus', desc: 'Task moves sync to all peers instantly', tag: '100% Live', tagType: 'emerald' },
        { label: 'Milestone Tracking', desc: 'Alpha release schedule on track for Friday', tag: '98% On Time', tagType: 'primary' },
        { label: 'Automated Dispatch', desc: 'Email notification sent to invitees & admins', tag: 'Verified', tagType: 'emerald' },
      ] as PreviewItem[],
    },
  },
];

export const HowItWorksSection: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const current = steps[activeStep];
  const CurrentIcon = current.icon;

  return (
    <section id="how-it-works" className="scroll-mt-20 border-b border-slate-200/60 bg-white py-24 dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
            How it works
          </span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            From empty workspace to shipping product
          </h2>
          <p className="mt-3 text-sm text-slate-600 sm:text-base dark:text-slate-400">
            Click through each phase to inspect how TeamFlow accelerates your team's development cycle.
          </p>
        </div>

        {/* Continuous Flow Pipeline Navigator */}
        <div className="mx-auto mb-10 max-w-4xl">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {steps.map((item, index) => {
              const Icon = item.icon;
              const isActive = activeStep === index;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveStep(index)}
                  className={cn(
                    'group relative flex items-center gap-3.5 rounded-2xl border p-4 text-left transition-all',
                    isActive
                      ? 'border-primary-500 bg-primary-50/50 shadow-md ring-2 ring-primary-500/20 dark:border-primary-600 dark:bg-primary-950/30'
                      : 'border-slate-200 bg-slate-50/70 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-700'
                  )}
                >
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold transition-colors',
                      isActive
                        ? 'bg-primary-600 text-white shadow-xs'
                        : 'bg-white text-slate-500 group-hover:text-slate-900 dark:bg-slate-800 dark:text-slate-400 dark:group-hover:text-white'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                      Step {item.step}
                    </span>
                    <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {item.title}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Interactive Stage Display */}
        <div className="mx-auto max-w-5xl rounded-3xl border border-slate-200/90 bg-gradient-to-br from-slate-50/50 via-white to-slate-50/80 p-6 shadow-xl sm:p-10 dark:border-slate-800 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            {/* Left: Detailed Highlights */}
            <div>
              <div className="inline-flex items-center gap-2 rounded-lg bg-primary-50 px-3 py-1 text-xs font-bold text-primary-700 dark:bg-primary-950/60 dark:text-primary-300">
                <CurrentIcon className="h-4 w-4" />
                <span>Phase {current.step}</span>
              </div>
              <h3 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                {current.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {current.subtitle}
              </p>

              <div className="mt-6 space-y-3">
                {current.details.map((detail, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    </div>
                    <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 sm:text-sm">
                      {detail}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex items-center gap-4">
                <Link to="/register">
                  <Button size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                    Get started with this flow
                  </Button>
                </Link>
                <Link to="/how-it-works" className="text-xs font-semibold text-primary-600 hover:underline dark:text-primary-400">
                  Full step guide &rarr;
                </Link>
              </div>
            </div>

            {/* Right: Live Interactive Workflow Mockup */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <div>
                  <span className="block text-xs font-bold text-primary-600 dark:text-primary-400">
                    {current.preview.badge}
                  </span>
                  <span className="block text-sm font-semibold text-slate-900 dark:text-white">
                    {current.preview.headline}
                  </span>
                </div>
                <span className="rounded-md bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {current.preview.meta}
                </span>
              </div>

              <div className="mt-4 space-y-2.5">
                {current.preview.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-xs transition-colors hover:bg-slate-100/70 dark:border-slate-800/80 dark:bg-slate-950/60 dark:hover:bg-slate-800/60"
                  >
                    <div>
                      <span className="block font-semibold text-slate-900 dark:text-white">{item.label}</span>
                      <span className="block text-[11px] text-slate-500">{item.desc}</span>
                    </div>
                    {item.tag && (
                      <span
                        className={cn(
                          'rounded px-2 py-0.5 text-[10px] font-bold',
                          item.tagType === 'primary' && 'bg-primary-100 text-primary-800 dark:bg-primary-950 dark:text-primary-300',
                          item.tagType === 'indigo' && 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
                          item.tagType === 'emerald' && 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        )}
                      >
                        {item.tag}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
