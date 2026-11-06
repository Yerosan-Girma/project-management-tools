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
      'TeamFlow establishes a secure WebSocket connection via Socket.IO upon authentication. Whenever a teammate creates a task, drags a card to a new column, or posts a comment, state updates propagate instantly to all active project members without needing to reload the browser.',
  },
  {
    question: 'What roles and permissions are supported?',
    answer:
      'TeamFlow provides four workspace hierarchy tiers: Owner (full administrative rights and billing/transfer control), Admin (can create projects and manage members), Member (creates and updates tasks/comments), and Viewer (read-only access). Projects also allow dedicated project-level assignments.',
  },
  {
    question: 'Can I customize Kanban board columns and workflow stages?',
    answer:
      'Yes. Every project automatically starts with default columns (To Do, In Progress, In Review, Done) that you can rename, reorder, delete with task re-allocation, or expand with custom workflow stages tailored to your development lifecycle.',
  },
  {
    question: 'How do task assignments and notifications work?',
    answer:
      'Tasks can be assigned to multiple teammates simultaneously. Assignees receive instant in-app alerts and notifications whenever they are assigned or when comments mention them.',
  },
  {
    question: 'Does TeamFlow support light and dark appearance themes?',
    answer:
      'Yes. TeamFlow includes first-class support for both high-contrast light mode and a deep slate dark mode. Your visual preference is automatically persisted across sessions.',
  },
  {
    question: 'Is my data isolated between workspaces?',
    answer:
      'Absolutely. Workspaces are strictly isolated multi-tenant domains. Members can only view projects and tasks within workspaces they have been explicitly invited to or joined.',
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
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
            Got Questions?
          </span>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl mt-1">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 text-base text-slate-600 dark:text-slate-400">
            Everything you need to know about TeamFlow and how our platform operates.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  className="flex w-full items-center justify-between p-5 text-left text-sm font-semibold text-slate-900 dark:text-white"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ml-4 ${
                      isOpen ? 'rotate-180 text-primary-600 dark:text-primary-400' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-0 text-xs leading-relaxed text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80 mt-1">
                    <div className="pt-3">{faq.answer}</div>
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
