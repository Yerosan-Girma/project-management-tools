import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, ArrowRight } from 'lucide-react';
import { PageHero } from '../components/PageHero';
import { FinalCtaSection } from '../components/FinalCtaSection';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../utils/cn';

const plans = [
  {
    name: 'Free',
    monthly: 0,
    yearly: 0,
    blurb: 'For a single team getting boards online.',
    cta: 'Create free account',
    to: '/register',
    features: ['1 workspace', 'Unlimited personal tasks', 'Kanban board', 'Email invitations'],
  },
  {
    name: 'Team',
    monthly: 12,
    yearly: 9,
    blurb: 'For product and engineering squads shipping together.',
    cta: 'Start team workspace',
    to: '/register',
    featured: true,
    features: ['Multiple projects', 'Roles & permissions', 'Calendar + analytics', 'Realtime comments', 'Priority support'],
  },
  {
    name: 'Organization',
    monthly: 29,
    yearly: 24,
    blurb: 'For agencies and companies with many workspaces.',
    cta: 'Talk to us',
    to: '/contact',
    features: ['Unlimited workspaces', 'Platform admin console', 'Audit-friendly isolation', 'Custom onboarding'],
  },
];

export const PricingPage: React.FC = () => {
  const [yearly, setYearly] = useState(true);

  return (
    <>
      <PageHero
        eyebrow="Pricing"
        title="Start free. Grow when the team does."
        description="Plans map to how TeamFlow is actually used: one workspace, a shipping team, or an organization with many isolated workspaces."
      />
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex justify-center">
            <div className="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setYearly(false)}
                className={cn(
                  'rounded-lg px-4 py-1.5 text-xs font-semibold',
                  !yearly ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white' : 'text-slate-500'
                )}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setYearly(true)}
                className={cn(
                  'rounded-lg px-4 py-1.5 text-xs font-semibold',
                  yearly ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white' : 'text-slate-500'
                )}
              >
                Yearly · save 25%
              </button>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => {
              const price = yearly ? plan.yearly : plan.monthly;
              return (
                <div
                  key={plan.name}
                  className={cn(
                    'flex flex-col rounded-2xl border bg-white p-6 dark:bg-slate-900',
                    plan.featured
                      ? 'border-primary-300 shadow-lg ring-2 ring-primary-500/20 dark:border-primary-700'
                      : 'border-slate-200 dark:border-slate-800'
                  )}
                >
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{plan.name}</h3>
                  <p className="mt-1 text-xs text-slate-500">{plan.blurb}</p>
                  <p className="mt-6 text-3xl font-extrabold text-slate-900 dark:text-white">
                    ${price}
                    <span className="text-sm font-medium text-slate-400"> / member / mo</span>
                  </p>
                  <ul className="mt-6 flex-1 space-y-2">
                    {plan.features.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <Check className="h-4 w-4 text-emerald-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link to={plan.to} className="mt-8">
                    <Button className="w-full" variant={plan.featured ? 'primary' : 'outline'} rightIcon={<ArrowRight className="h-4 w-4" />}>
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <FinalCtaSection />
    </>
  );
};

export default PricingPage;
