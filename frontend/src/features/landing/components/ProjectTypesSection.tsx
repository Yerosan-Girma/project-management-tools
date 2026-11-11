import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, Code2, Compass, Briefcase, Building2, Check, Sparkles } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { solutionTypes } from '../data/marketing';
import { cn } from '../../../utils/cn';

const icons = [Code2, Compass, Building2, Briefcase];

const previewsBySolution: Record<string, { tag: string; badge: string; items: { title: string; subtitle: string; status: string }[] }> = {
  software: {
    tag: 'Engineering Sprints & Backlog',
    badge: 'Sprint 14 Active',
    items: [
      { title: 'User authentication & login with Google', subtitle: 'Assigned to Gemachu • Ready for code review', status: 'In Review' },
      { title: 'Real-time task card drag & drop board', subtitle: 'Assigned to Yerosan Girma • Active sprint task', status: 'In Progress' },
      { title: 'Automated test suite & security checks', subtitle: 'Assigned to Yoni Tola • Passed all checks', status: 'Shipped' },
    ],
  },
  product: {
    tag: 'Product Roadmap & Milestones',
    badge: 'Roadmap Delivery',
    items: [
      { title: 'Mobile App 2.0 release for customers', subtitle: 'Target: Nov 28 • 85% completed', status: 'On Track' },
      { title: 'Customer feedback interview summaries', subtitle: '14 user interviews reviewed', status: 'In Review' },
      { title: 'Self-service team subscription billing', subtitle: 'Ready for initial user testing', status: 'Ready' },
    ],
  },
  operations: {
    tag: 'Cross-Team Operations & Deadlines',
    badge: 'Ops Schedule',
    items: [
      { title: 'Quarterly team security & access review', subtitle: 'Assigned to Yerosan Girma • On schedule', status: 'In Progress' },
      { title: 'Annual workspace access renewal', subtitle: 'All team leads verified and active', status: 'Verified' },
      { title: 'New teammate onboarding guide', subtitle: 'Shared in team documentation wiki', status: 'Active' },
    ],
  },
  agencies: {
    tag: 'Multi-Client Tenant Segregation',
    badge: 'Client Separation',
    items: [
      { title: 'Acme Corp: Brand redesign deliverables', subtitle: 'Client invited as Viewer • Private board', status: 'Active Sprint' },
      { title: 'Globex Inc: Online store setup', subtitle: 'Milestone 2 deliverables pending review', status: 'In Review' },
      { title: 'Stark Labs: Cloud migration setup', subtitle: 'Approved and delivered to client', status: 'Delivered' },
    ],
  },
};

export const ProjectTypesSection: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeId, setActiveId] = useState(searchParams.get('type') || 'software');
  const active = solutionTypes.find((item) => item.id === activeId) ?? solutionTypes[0];
  const preview = previewsBySolution[active.id] || previewsBySolution.software;

  useEffect(() => {
    const type = searchParams.get('type');
    if (type && solutionTypes.some((item) => item.id === type)) {
      setActiveId(type);
    }
  }, [searchParams]);

  const selectType = (id: string) => {
    setActiveId(id);
    const next = new URLSearchParams(searchParams);
    next.set('type', id);
    setSearchParams(next, { replace: true });
  };

  return (
    <section id="solutions" className="scroll-mt-20 border-y border-slate-200/60 bg-white py-24 dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
            Tailored solutions
          </span>
          <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            One powerful engine, shaped for how your team works
          </h2>
          <p className="mt-3 text-sm text-slate-600 sm:text-base dark:text-slate-400">
            Select your discipline to see the exact board structure, workflows, and role permissions preconfigured for you.
          </p>
        </div>

        {/* Segmented Selector Navigation */}
        <div className="mx-auto mb-8 flex max-w-2xl flex-wrap justify-center gap-2">
          {solutionTypes.map((item, index) => {
            const Icon = icons[index] || Code2;
            const selected = item.id === activeId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => selectType(item.id)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-bold transition-all',
                  selected
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-500/25 ring-2 ring-primary-500/30'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label} teams</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Solution Showcase Panel */}
        <div className="rounded-3xl border border-slate-200/90 bg-gradient-to-br from-slate-50/50 via-white to-slate-50/80 p-6 shadow-xl sm:p-10 dark:border-slate-800 dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            {/* Left Content */}
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-md bg-primary-50 px-2.5 py-1 text-[11px] font-bold text-primary-700 dark:bg-primary-950/60 dark:text-primary-300">
                <Sparkles className="h-3.5 w-3.5" />
                <span>{active.label} Workflow</span>
              </div>
              <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                {active.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {active.description}
              </p>

              {/* Highlights List */}
              <div className="mt-6 space-y-2.5">
                {active.highlights.map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 sm:text-sm">
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/features">
                  <Button size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                    Explore {active.label} features
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" variant="outline">
                    Start free {active.label.toLowerCase()} workspace
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right: Live Interactive Workflow Mockup */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-slate-800">
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                    Live Board Template
                  </span>
                  <span className="block text-sm font-semibold text-slate-900 dark:text-white">
                    {preview.tag}
                  </span>
                </div>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {preview.badge}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {preview.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 text-xs transition-colors hover:bg-slate-100/70 dark:border-slate-800/80 dark:bg-slate-950/60 dark:hover:bg-slate-800/60"
                  >
                    <div className="min-w-0 pr-3">
                      <span className="block truncate font-semibold text-slate-900 dark:text-white">
                        {item.title}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-slate-500 dark:text-slate-400">
                        {item.subtitle}
                      </span>
                    </div>
                    <span className="shrink-0 rounded bg-primary-50 px-2 py-1 text-[10px] font-bold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                      {item.status}
                    </span>
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
