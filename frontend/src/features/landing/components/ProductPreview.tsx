import React, { useState } from 'react';
import { Kanban, BarChart3, CheckSquare, Clock, Users, CalendarDays } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import { cn } from '../../../utils/cn';

type PreviewTab = 'board' | 'tasks' | 'calendar' | 'team' | 'analytics';

const tabs: { id: PreviewTab; label: string; icon: typeof Kanban }[] = [
  { id: 'board', label: 'Kanban', icon: Kanban },
  { id: 'tasks', label: 'My tasks', icon: CheckSquare },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

const boardCards = [
  { id: 'MOB-12', title: 'Export crash telemetry to Sentry', column: 'Backlog', priority: 'LOW' },
  { id: 'MOB-15', title: 'Biometric FaceID authentication hook', column: 'Backlog', priority: 'MEDIUM' },
  { id: 'MOB-09', title: 'Offline cache rehydration with SQLite', column: 'In Progress', priority: 'URGENT' },
  { id: 'MOB-06', title: 'Push notification deep linking routing', column: 'Review', priority: 'HIGH' },
  { id: 'MOB-01', title: 'Design tokens and dark mode palette', column: 'Done', priority: 'DONE' },
];

export const ProductPreview: React.FC = () => {
  const [activeTab, setActiveTab] = useState<PreviewTab>('board');
  const [selectedCard, setSelectedCard] = useState('MOB-09');

  return (
    <section id="preview" className="scroll-mt-20 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
              Product preview
            </span>
            <h2 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              The same surfaces your team will use every day
            </h2>
            <p className="mt-2 max-w-xl text-sm text-slate-600 dark:text-slate-400">
              Switch views the way the dashboard does — board, tasks, calendar, team, and analytics.
            </p>
          </div>
        </div>

        <div className="mb-4 flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'inline-flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all',
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          {activeTab === 'board' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Mobile Application 2.0 (MOB)</h3>
                  <p className="text-xs text-slate-500">Sprint 14 • click a card to inspect it</p>
                </div>
                <Badge variant="success" size="sm">
                  Active sprint
                </Badge>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {['Backlog', 'In Progress', 'Review', 'Done'].map((column) => (
                  <div
                    key={column}
                    className="rounded-xl border border-slate-200/60 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-950/40"
                  >
                    <div className="mb-3 flex items-center justify-between px-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span>{column}</span>
                      <span className="text-slate-400">{boardCards.filter((c) => c.column === column).length}</span>
                    </div>
                    <div className="space-y-2">
                      {boardCards
                        .filter((c) => c.column === column)
                        .map((card) => (
                          <button
                            key={card.id}
                            type="button"
                            onClick={() => setSelectedCard(card.id)}
                            className={cn(
                              'w-full rounded-lg border bg-white p-3 text-left shadow-xs transition-all dark:bg-slate-900',
                              selectedCard === card.id
                                ? 'border-primary-400 ring-2 ring-primary-500/30'
                                : 'border-slate-200/70 hover:border-slate-300 dark:border-slate-800'
                            )}
                          >
                            <div className="mb-1 flex items-center justify-between">
                              <span className="font-mono text-[10px] text-slate-400">{card.id}</span>
                              <Badge
                                variant={
                                  card.priority === 'URGENT'
                                    ? 'danger'
                                    : card.priority === 'HIGH'
                                      ? 'primary'
                                      : card.priority === 'DONE'
                                        ? 'success'
                                        : 'outline'
                                }
                                size="sm"
                              >
                                {card.priority}
                              </Badge>
                            </div>
                            <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{card.title}</p>
                          </button>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500">
                Selected: <span className="font-semibold text-primary-600">{selectedCard}</span> — same card chrome as the in-app board.
              </p>
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-2">
              {boardCards.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => setSelectedCard(card.id)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-colors',
                    selectedCard === card.id
                      ? 'border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-950/40'
                      : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/60'
                  )}
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{card.title}</p>
                    <p className="text-xs text-slate-500">
                      {card.id} · {card.column}
                    </p>
                  </div>
                  <Badge size="sm">{card.priority}</Badge>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'calendar' && (
            <div className="grid grid-cols-7 gap-2 text-center text-xs">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                <div key={day} className="font-semibold text-slate-500">
                  {day}
                </div>
              ))}
              {Array.from({ length: 28 }).map((_, index) => {
                const hasTask = index === 3 || index === 10 || index === 16;
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => hasTask && setSelectedCard(boardCards[index % boardCards.length].id)}
                    className={cn(
                      'min-h-[72px] rounded-xl border p-2 text-left transition-colors',
                      hasTask
                        ? 'border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-950/40'
                        : 'border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-950/40'
                    )}
                  >
                    <span className="font-semibold text-slate-700 dark:text-slate-200">{index + 1}</span>
                    {hasTask && (
                      <span className="mt-2 block truncate rounded bg-white px-1.5 py-0.5 text-[10px] font-medium text-primary-700 dark:bg-slate-900 dark:text-primary-300">
                        {boardCards[index % boardCards.length].title}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {activeTab === 'team' && (
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { name: 'Alex Rivera', role: 'Owner', initials: 'AR' },
                { name: 'Riley Kim', role: 'Admin', initials: 'RK' },
                { name: 'Jordan Lee', role: 'Member', initials: 'JL' },
              ].map((member) => (
                <div
                  key={member.name}
                  className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-sm font-bold text-white">
                    {member.initials}
                  </div>
                  <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">{member.name}</p>
                  <p className="text-xs text-slate-500">{member.role}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {[
                { label: 'Total tasks', value: '48', hint: '↑ 12% vs last sprint', icon: CheckSquare },
                { label: 'Completed', value: '39', hint: '82% done', icon: BarChart3 },
                { label: 'Active members', value: '7', hint: '3 time zones', icon: Users },
                { label: 'Overdue', value: '0%', hint: 'On schedule', icon: Clock },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/40"
                  >
                    <div className="mb-1 flex items-center justify-between text-slate-500">
                      <span className="text-xs font-medium">{stat.label}</span>
                      <Icon className="h-4 w-4 text-primary-500" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
                    <span className="text-[11px] font-medium text-emerald-600">{stat.hint}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
