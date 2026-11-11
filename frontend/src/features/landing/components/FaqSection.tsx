import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { faqs } from '../data/marketing';
import { cn } from '../../../utils/cn';

interface FaqSectionProps {
  limit?: number;
  showAllLink?: boolean;
  showHeading?: boolean;
}

export const FaqSection: React.FC<FaqSectionProps> = ({ limit, showAllLink = true, showHeading = true }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const items = limit ? faqs.slice(0, limit) : faqs;

  return (
    <section id="faq" className="scroll-mt-20 py-20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {showHeading && (
          <div className="mb-10 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
              Frequently asked questions
            </span>
            <h2 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
              Everything you need to know
            </h2>
          </div>
        )}

        <div className="space-y-3">
          {items.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.question}
                className={cn(
                  'overflow-hidden rounded-2xl border bg-white transition-all dark:bg-slate-900',
                  isOpen ? 'border-primary-200 dark:border-primary-800' : 'border-slate-200/80 dark:border-slate-800'
                )}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="flex w-full items-center justify-between p-5 text-left text-sm font-semibold text-slate-900 transition-colors hover:text-primary-600 dark:text-white dark:hover:text-primary-400"
                  aria-expanded={isOpen}
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={cn(
                      'ml-4 h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200',
                      isOpen && 'rotate-180 text-primary-600'
                    )}
                  />
                </button>
                <div
                  className={cn(
                    'grid transition-all duration-200',
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="border-t border-slate-100 px-5 pb-5 pt-3 text-xs leading-relaxed text-slate-600 dark:border-slate-800/80 dark:text-slate-400">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {showAllLink && limit && (
          <p className="mt-6 text-center text-sm">
            <Link to="/faq" className="font-semibold text-primary-600 hover:text-primary-700">
              View all questions
            </Link>
          </p>
        )}
      </div>
    </section>
  );
};
