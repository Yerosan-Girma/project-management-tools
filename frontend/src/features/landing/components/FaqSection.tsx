import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

const faqs: FaqItem[] = [
  {
    question: 'How does real-time synchronization work in TeamFlow?',
    answer:
      'TeamFlow connects active team members via secure WebSockets. Whenever a teammate creates a task, drags a card to a new column, or posts a comment, state updates propagate instantly across all connected clients without needing to reload.',
  },
  {
    question: 'What roles and permissions are supported?',
    answer:
      'TeamFlow provides four workspace hierarchy tiers: Owner (full administrative rights and settings control), Admin (can create projects and invite members), Member (creates and updates assigned tasks and comments), and Viewer (read-only observer access).',
  },
  {
    question: 'Can I customize Kanban board columns and workflow stages?',
    answer:
      'Yes. Every project automatically starts with standard workflow stages (To Do, In Progress, Review, Completed) that you can rename, reorder, or customize to match your team’s delivery methodology.',
  },
  {
    question: 'Is workspace data strictly isolated between different teams?',
    answer:
      'Absolutely. Workspaces are strictly isolated multi-tenant environments. Users can only access projects, tasks, and member lists for workspaces they have explicitly created or been invited to.',
  },
];

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
            Frequently Asked Questions
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl mt-1">
            Everything you need to know
          </h2>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
            Common questions regarding TeamFlow features, security, and real-time collaboration.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden transition-all duration-150"
              >
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  className="w-full flex items-center justify-between p-5 text-left text-sm font-semibold text-slate-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 shrink-0 ml-4 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-primary-600' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-0 text-xs leading-relaxed text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 mt-1 pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
