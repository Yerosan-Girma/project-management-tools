import React from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Columns3,
  Users,
  ArrowRight,
  CheckCircle2,
  Zap,
  CalendarDays,
} from 'lucide-react';
import { PageHero } from '../components/PageHero';
import { FinalCtaSection } from '../components/FinalCtaSection';
import { Button } from '../../../components/ui/Button';

const lifecyclePhases = [
  {
    phase: '01',
    title: 'Workspace Spinup & Boundary Isolation',
    icon: Building2,
    lead: 'Create an isolated multi-tenant organization container in seconds.',
    description:
      'Every team starts with its own isolated workspace in PostgreSQL. No shared state, no cross-team ticket leakage, and full administrative autonomy.',
    points: [
      'Custom workspace naming and URL handle',
      'Automatic provisioning of owner permissions',
      'Dedicated project directory and member registry',
    ],
    badge: 'Database Isolation',
  },
  {
    phase: '02',
    title: 'Invite Team & Configure Role Governance',
    icon: Users,
    lead: 'Add team members with cryptographically signed email invitations.',
    description:
      'Distribute roles according to team responsibilities: Platform Admin, Workspace Owner, Project Admin, Member, or Viewer.',
    points: [
      'Automated SMTP email dispatch with 7-day secure tokens',
      'In-app invitation notification for existing users',
      'Instant role revocation and member offboarding',
    ],
    badge: 'Role Security',
  },
  {
    phase: '03',
    title: 'Sprint Backlog & Kanban Column Configuration',
    icon: Columns3,
    lead: 'Set up sprint workflows tailored to your development velocity.',
    description:
      'Projects come preconfigured with industry-standard stages (To Do, In Progress, Review, and Done) which can be customized to match your CI/CD pipeline.',
    points: [
      'Issue keys and structured task identifiers (e.g. ENG-104)',
      'Priority tags (Urgent, High, Medium, Low) and due dates',
      'Rich Markdown task descriptions and file attachments',
    ],
    badge: 'Agile Kanban',
  },
  {
    phase: '04',
    title: 'Live Collaboration via Bidirectional WebSockets',
    icon: Zap,
    lead: 'Never refresh your browser to see sprint updates.',
    description:
      'When an engineer drags an issue card or updates task progress, our Socket.IO engine broadcasts the delta to all connected peers in under 15 milliseconds.',
    points: [
      'Zero-latency drag-and-drop state synchronization',
      'Real-time task comment streams and activity history',
      'Automatic conflict resolution and stale-state defense',
    ],
    badge: 'WebSocket Bus',
  },
  {
    phase: '05',
    title: 'Milestone Tracking & Cross-Project Calendar',
    icon: CalendarDays,
    lead: 'Deliver on time with unified sprint analytics and deadline schedules.',
    description:
      'Consolidate deliverable deadlines from multiple projects into a single calendar view, tracking team velocity and completed story points.',
    points: [
      'Cross-project milestone calendar without switching screens',
      'Real-time sprint velocity charts and status distributions',
      'Upcoming deadline alerts delivered directly to email',
    ],
    badge: 'Ship On Time',
  },
];

export const HowItWorksPage: React.FC = () => {
  return (
    <>
      <PageHero
        eyebrow="Workflow Walkthrough"
        title="The TeamFlow development lifecycle"
        description="Inspect the complete path from initial workspace provisioning to live sprint execution and milestone delivery."
      />

      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {/* Vertical Lifecycle Stream */}
          <div className="relative space-y-12 before:absolute before:bottom-0 before:left-6 before:top-6 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800 sm:before:left-8">
            {lifecyclePhases.map((phase) => {
              const Icon = phase.icon;
              return (
                <div key={phase.phase} className="relative flex items-start gap-6 sm:gap-8">
                  {/* Phase Marker */}
                  <div className="relative z-10 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-primary-600 font-bold text-white shadow-md dark:border-slate-950 sm:h-16 sm:w-16">
                    <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
                  </div>

                  {/* Phase Content Body */}
                  <div className="min-w-0 flex-1 rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs sm:p-8 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                        Phase {phase.phase}
                      </span>
                      <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {phase.badge}
                      </span>
                    </div>

                    <h3 className="mt-2 text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">
                      {phase.title}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                      {phase.lead}
                    </p>
                    <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400 sm:text-sm">
                      {phase.description}
                    </p>

                    <div className="mt-5 space-y-2 border-t border-slate-100 pt-4 dark:border-slate-800">
                      {phase.points.map((point, idx) => (
                        <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300 sm:text-sm">
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                          <span>{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-16 text-center">
            <Link to="/register">
              <Button size="lg" rightIcon={<ArrowRight className="h-5 w-5" />}>
                Start your team workspace
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <FinalCtaSection />
    </>
  );
};

export default HowItWorksPage;
