import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, FolderGit2, Columns3, Users, Bell, ArrowRight } from 'lucide-react';
import { PageHero } from '../components/PageHero';
import { FinalCtaSection } from '../components/FinalCtaSection';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../utils/cn';

const walkthrough = [
  {
    title: 'Create an account',
    detail: 'Register with email, verify if required, and land in an empty workspace ready for your first project.',
    icon: Building2,
  },
  {
    title: 'Create a workspace',
    detail: 'Name the workspace for a product line, client, or department. Data never leaks into other workspaces.',
    icon: FolderGit2,
  },
  {
    title: 'Add a project and board',
    detail: 'Give the project a key, then customize columns. Cards carry assignees, due dates, and comments.',
    icon: Columns3,
  },
  {
    title: 'Invite the team',
    detail: 'Send an invitation with a role. Members accept from email or the in-app banner and immediately see the board.',
    icon: Users,
  },
  {
    title: 'Ship with live updates',
    detail: 'Calendar, notifications, and analytics stay in the same sidebar so delivery does not jump between tools.',
    icon: Bell,
  },
];

export const HowItWorksPage: React.FC = () => {
  const [step, setStep] = useState(0);
  const current = walkthrough[step];
  const Icon = current.icon;

  return (
    <>
      <PageHero
        eyebrow="How it works"
        title="From signup to a live board in five clicks"
        description="Step through the exact path a new team takes in TeamFlow. Each step maps to a real screen in the app."
      />
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-wrap gap-2">
            {walkthrough.map((item, index) => (
              <button
                key={item.title}
                type="button"
                onClick={() => setStep(index)}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-xs font-semibold',
                  step === index
                    ? 'border-primary-600 bg-primary-600 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-primary-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'
                )}
              >
                {index + 1}. {item.title}
              </button>
            ))}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-300">
              <Icon className="h-6 w-6" />
            </div>
            <h2 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">{current.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{current.detail}</p>
            <div className="mt-6 flex gap-2">
              <Button variant="outline" size="sm" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
                Previous
              </Button>
              <Button
                size="sm"
                disabled={step === walkthrough.length - 1}
                onClick={() => setStep((s) => Math.min(walkthrough.length - 1, s + 1))}
              >
                Next step
              </Button>
            </div>
          </div>
          <div className="mt-8 text-center">
            <Link to="/register">
              <Button rightIcon={<ArrowRight className="h-4 w-4" />}>Create your workspace</Button>
            </Link>
          </div>
        </div>
      </section>
      <FinalCtaSection />
    </>
  );
};

export default HowItWorksPage;
