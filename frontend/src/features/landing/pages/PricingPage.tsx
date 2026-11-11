import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, X, ArrowRight } from 'lucide-react';
import { PageHero } from '../components/PageHero';
import { FinalCtaSection } from '../components/FinalCtaSection';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../utils/cn';

const plans = [
  {
    name: 'Free',
    monthly: 0,
    yearly: 0,
    blurb: 'For small squads and personal projects getting boards online.',
    cta: 'Create free account',
    to: '/register',
    features: ['1 isolated workspace', 'Up to 3 projects', 'Real-time Kanban boards', 'Email member invitations', 'Community support'],
  },
  {
    name: 'Team',
    monthly: 12,
    yearly: 9,
    blurb: 'For engineering and product squads shipping in active sprints.',
    cta: 'Start team workspace',
    to: '/register',
    featured: true,
    features: [
      'Unlimited projects',
      'Advanced role governance (Admin, Member, Viewer)',
      'Cross-project calendar & analytics',
      'Real-time comments & attachments',
      'Priority support',
    ],
  },
  {
    name: 'Organization',
    monthly: 29,
    yearly: 24,
    blurb: 'For companies and agencies managing multiple client workspaces.',
    cta: 'Contact team',
    to: '/contact',
    features: [
      'Unlimited isolated workspaces',
      'Platform administrator console',
      'Custom security & SSO options',
      'Audit log retention & export',
      'Dedicated migration onboarding',
    ],
  },
];

const featureComparison = [
  { feature: 'Multi-tenant workspace isolation', free: '1 Workspace', team: 'Unlimited', org: 'Unlimited' },
  { feature: 'Projects per workspace', free: '3 Projects', team: 'Unlimited', org: 'Unlimited' },
  { feature: 'Real-time WebSocket synchronization', free: true, team: true, org: true },
  { feature: 'Kanban boards & custom stages', free: true, team: true, org: true },
  { feature: 'Task assignments & priority tags', free: true, team: true, org: true },
  { feature: 'Verified email invitations', free: true, team: true, org: true },
  { feature: 'Cross-project deadline calendar', free: false, team: true, org: true },
  { feature: 'Sprint velocity & analytics charts', free: false, team: true, org: true },
  { feature: 'Granular 5-tier role governance', free: false, team: true, org: true },
  { feature: 'Platform admin console & audit logs', free: false, team: false, org: true },
];

export const PricingPage: React.FC = () => {
  const [yearly, setYearly] = useState(true);

  return (
    <>
      <PageHero
        eyebrow="Transparent Pricing"
        title="Start free, scale as your team delivers"
        description="Simple plans that reflect how TeamFlow is actually used: a personal workspace, a fast-moving engineering squad, or an enterprise organization."
      />

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Monthly / Yearly Toggle */}
          <div className="mb-12 flex justify-center">
            <div className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setYearly(false)}
                className={cn(
                  'rounded-lg px-4 py-2 text-xs font-semibold transition-all',
                  !yearly ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white' : 'text-slate-500'
                )}
              >
                Monthly billing
              </button>
              <button
                type="button"
                onClick={() => setYearly(true)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all',
                  yearly ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white' : 'text-slate-500'
                )}
              >
                <span>Yearly billing</span>
                <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  Save 25%
                </span>
              </button>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => {
              const price = yearly ? plan.yearly : plan.monthly;
              return (
                <div
                  key={plan.name}
                  className={cn(
                    'relative flex flex-col justify-between rounded-3xl border bg-white p-8 transition-all hover:shadow-xl dark:bg-slate-900',
                    plan.featured
                      ? 'border-primary-500 shadow-lg ring-2 ring-primary-500/20 dark:border-primary-600'
                      : 'border-slate-200/90 dark:border-slate-800'
                  )}
                >
                  {plan.featured && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary-600 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-xs">
                      Most popular for squads
                    </div>
                  )}

                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                    <p className="mt-1 text-xs text-slate-500">{plan.blurb}</p>

                    <div className="mt-6 flex items-baseline gap-1">
                      <span className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">${price}</span>
                      <span className="text-xs font-medium text-slate-500">/ member / month</span>
                    </div>

                    <ul className="mt-8 space-y-3">
                      {plan.features.map((item) => (
                        <li key={item} className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300 sm:text-sm">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <Link to={plan.to}>
                      <Button
                        className="w-full"
                        variant={plan.featured ? 'primary' : 'outline'}
                        rightIcon={<ArrowRight className="h-4 w-4" />}
                      >
                        {plan.cta}
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Full Feature Comparison Table */}
          <div className="mt-20">
            <div className="mb-8 text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                Detailed Comparison
              </span>
              <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
                Compare plan capabilities
              </h3>
            </div>

            <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:border-slate-800 dark:bg-slate-950/80 dark:text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Capability</th>
                    <th className="px-4 py-4 text-center">Free</th>
                    <th className="px-4 py-4 text-center">Team</th>
                    <th className="px-4 py-4 text-center">Organization</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {featureComparison.map((row, idx) => (
                    <tr key={idx} className="transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="px-6 py-3.5 font-medium text-slate-900 dark:text-white">{row.feature}</td>
                      <td className="px-4 py-3.5 text-center text-slate-600 dark:text-slate-300">
                        {typeof row.free === 'boolean' ? (
                          row.free ? (
                            <Check className="mx-auto h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <X className="mx-auto h-4 w-4 text-slate-300 dark:text-slate-700" />
                          )
                        ) : (
                          row.free
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center font-semibold text-primary-700 dark:text-primary-300">
                        {typeof row.team === 'boolean' ? (
                          row.team ? (
                            <Check className="mx-auto h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <X className="mx-auto h-4 w-4 text-slate-300 dark:text-slate-700" />
                          )
                        ) : (
                          row.team
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-center font-semibold text-slate-900 dark:text-white">
                        {typeof row.org === 'boolean' ? (
                          row.org ? (
                            <Check className="mx-auto h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <X className="mx-auto h-4 w-4 text-slate-300 dark:text-slate-700" />
                          )
                        ) : (
                          row.org
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <FinalCtaSection />
    </>
  );
};

export default PricingPage;
