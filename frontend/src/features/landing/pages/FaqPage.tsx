import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ChevronDown, ArrowRight } from 'lucide-react';
import { PageHero } from '../components/PageHero';
import { FinalCtaSection } from '../components/FinalCtaSection';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../utils/cn';

const categories = ['All', 'Workspaces', 'Security & Roles', 'Kanban & Sync', 'Billing'];

const categorizedFaqs = [
  {
    category: 'Workspaces',
    question: 'Is workspace data isolated between teams?',
    answer:
      'Yes. Workspaces are strictly multi-tenant. Users only see projects, tasks, boards, and members for workspaces they own or were explicitly invited into.',
  },
  {
    category: 'Workspaces',
    question: 'Can I belong to multiple workspaces with one login?',
    answer:
      'Yes. Your user account can be an Owner in one workspace, a Member in another, and a Viewer in a client workspace. You can switch between them instantly in the Workspaces manager.',
  },
  {
    category: 'Kanban & Sync',
    question: 'How does real-time synchronization work in TeamFlow?',
    answer:
      'TeamFlow connects active members over WebSockets. When someone creates a task, moves a card, or posts a comment, every open workspace updates in milliseconds without refreshing.',
  },
  {
    category: 'Kanban & Sync',
    question: 'Can I customize Kanban columns?',
    answer:
      'Yes. Projects start with standard sprint columns (To Do, In Progress, Review, and Done). You can rename and reorder columns to match your team’s delivery methodology.',
  },
  {
    category: 'Security & Roles',
    question: 'What roles and permissions are supported?',
    answer:
      'Each workspace uses Owner, Admin, Member, and Viewer tiers. Owners control settings and billing, Admins manage projects and invitations, Members work on tasks, and Viewers have read-only access.',
  },
  {
    category: 'Security & Roles',
    question: 'How are invitations verified?',
    answer:
      'Invitations are cryptographically signed with 32-byte tokens sent via verified email. Non-registered users can register directly from the invite link, while existing members can accept in-app.',
  },
  {
    category: 'Billing',
    question: 'Do I need a credit card to start?',
    answer:
      'No. You can create a free account, launch a workspace, and invite your team. Paid organization plans unlock higher member limits and custom enterprise support when you need them.',
  },
  {
    category: 'Billing',
    question: 'Can I invite external clients for free?',
    answer:
      'Yes. External clients can be added as Viewers to specific client workspaces, giving them full visibility into board progress without edit rights.',
  },
];

export const FaqPage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const filtered = categorizedFaqs.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch =
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <>
      <PageHero
        eyebrow="Help & FAQ"
        title="Frequently asked questions"
        description="Everything you need to know about TeamFlow workspaces, real-time Kanban boards, role permissions, and billing."
      />

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          {/* Search bar */}
          <div className="relative mb-8">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search questions (e.g. roles, WebSockets, isolation, billing)..."
              className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm text-slate-900 shadow-xs outline-none transition-all placeholder:text-slate-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
          </div>

          {/* Category Pills */}
          <div className="mb-10 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'rounded-full px-4 py-1.5 text-xs font-semibold transition-all',
                  selectedCategory === cat
                    ? 'bg-primary-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* FAQ Accordion List */}
          <div className="space-y-3">
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-800">
                No matching questions found. Try a different keyword or contact our support team.
              </div>
            ) : (
              filtered.map((faq, index) => {
                const isOpen = openIndex === index;
                return (
                  <div
                    key={faq.question}
                    className={cn(
                      'overflow-hidden rounded-2xl border bg-white transition-all dark:bg-slate-900',
                      isOpen
                        ? 'border-primary-200 shadow-xs dark:border-primary-800'
                        : 'border-slate-200/80 dark:border-slate-800'
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setOpenIndex(isOpen ? null : index)}
                      className="flex w-full items-center justify-between p-5 text-left text-sm font-semibold text-slate-900 transition-colors hover:text-primary-600 dark:text-white dark:hover:text-primary-400"
                    >
                      <span>{faq.question}</span>
                      <ChevronDown
                        className={cn(
                          'ml-4 h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200',
                          isOpen && 'rotate-180 text-primary-600'
                        )}
                      />
                    </button>
                    {isOpen && (
                      <div className="border-t border-slate-100 px-5 pb-5 pt-3 text-xs leading-relaxed text-slate-600 dark:border-slate-800/80 dark:text-slate-400 sm:text-sm">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Still have questions card */}
          <div className="mt-12 flex flex-col items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-6 text-center sm:flex-row sm:text-left dark:border-slate-800 dark:bg-slate-900">
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Still have questions?</h4>
              <p className="mt-1 text-xs text-slate-500">
                Our platform administrators are available to help you set up your team.
              </p>
            </div>
            <Link to="/contact">
              <Button size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Ask a question
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <FinalCtaSection />
    </>
  );
};

export default FaqPage;
