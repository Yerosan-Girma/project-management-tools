import React, { useState } from 'react';
import { Kanban, BarChart3, CheckSquare, Clock, Users } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';

export const ProductPreview: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'board' | 'analytics'>('board');

  return (
    <section id="preview" className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400">
              Interface Preview
            </span>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
              Engineered for absolute focus
            </h2>
          </div>

          {/* Toggle pill buttons */}
          <div className="inline-flex rounded-lg bg-slate-100 p-1 dark:bg-slate-800 self-start md:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('board')}
              className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'board'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              Kanban Flow
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('analytics')}
              className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 text-xs font-semibold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Project Metrics
            </button>
          </div>
        </div>

        {/* View container */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          {activeTab === 'board' ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary-600 text-white font-bold flex items-center justify-center text-sm">
                    TF
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                      Mobile Application 2.0 (MOB)
                    </h3>
                    <p className="text-xs text-slate-500">Sprint 14 • 18 active tasks</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="success" size="sm">Active Sprint</Badge>
                  <div className="flex -space-x-2">
                    <div className="h-7 w-7 rounded-full bg-indigo-500 text-white text-xs flex items-center justify-center font-bold ring-2 ring-white dark:ring-slate-900">
                      AL
                    </div>
                    <div className="h-7 w-7 rounded-full bg-emerald-500 text-white text-xs flex items-center justify-center font-bold ring-2 ring-white dark:ring-slate-900">
                      RK
                    </div>
                    <div className="h-7 w-7 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold ring-2 ring-white dark:ring-slate-900">
                      +4
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 realistic Kanban columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Backlog */}
                <div className="rounded-xl bg-slate-50/70 p-3 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3 px-1">
                    <span>Backlog</span>
                    <span className="text-slate-400">2</span>
                  </div>
                  <div className="space-y-2">
                    <div className="rounded-lg bg-white p-3 shadow-xs border border-slate-200/70 dark:bg-slate-900 dark:border-slate-800">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-mono text-slate-400">MOB-12</span>
                        <Badge variant="outline" size="sm">LOW</Badge>
                      </div>
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                        Export crash telemetry to Sentry
                      </p>
                    </div>
                    <div className="rounded-lg bg-white p-3 shadow-xs border border-slate-200/70 dark:bg-slate-900 dark:border-slate-800">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-mono text-slate-400">MOB-15</span>
                        <Badge variant="warning" size="sm">MEDIUM</Badge>
                      </div>
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                        Biometric FaceID authentication hook
                      </p>
                    </div>
                  </div>
                </div>

                {/* In Progress */}
                <div className="rounded-xl bg-slate-50/70 p-3 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs font-semibold text-primary-600 dark:text-primary-400 mb-3 px-1">
                    <span>In Progress</span>
                    <span className="text-primary-600 font-bold">1</span>
                  </div>
                  <div className="space-y-2">
                    <div className="rounded-lg bg-white p-3 shadow-xs border-l-4 border-l-primary-500 border border-slate-200/70 dark:bg-slate-900 dark:border-slate-800">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-mono text-primary-600 font-semibold">MOB-09</span>
                        <Badge variant="danger" size="sm">URGENT</Badge>
                      </div>
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                        Offline cache rehydration with SQLite
                      </p>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span className="flex items-center gap-1 text-slate-500">
                          <Clock className="w-3 h-3" /> Due tomorrow
                        </span>
                        <span className="text-xs font-bold text-primary-600">AL</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* In Review */}
                <div className="rounded-xl bg-slate-50/70 p-3 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs font-semibold text-amber-600 dark:text-amber-400 mb-3 px-1">
                    <span>Review</span>
                    <span className="text-slate-400">1</span>
                  </div>
                  <div className="space-y-2">
                    <div className="rounded-lg bg-white p-3 shadow-xs border border-slate-200/70 dark:bg-slate-900 dark:border-slate-800">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-mono text-slate-400">MOB-06</span>
                        <Badge variant="primary" size="sm">HIGH</Badge>
                      </div>
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                        Push notification deep linking routing
                      </p>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <span>3 comments</span>
                        <span className="text-xs font-bold text-emerald-600">RK</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Done */}
                <div className="rounded-xl bg-slate-50/70 p-3 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-3 px-1">
                    <span>Done</span>
                    <span className="text-emerald-600 font-bold">4</span>
                  </div>
                  <div className="space-y-2">
                    <div className="rounded-lg bg-white p-3 shadow-xs border border-slate-200/70 dark:bg-slate-900 dark:border-slate-800 opacity-75">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-mono line-through text-slate-400">MOB-01</span>
                        <Badge variant="success" size="sm">DONE</Badge>
                      </div>
                      <p className="text-xs font-medium text-slate-600 line-through dark:text-slate-400">
                        Design tokens and dark mode palette
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Analytics Tab Preview */
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-xs font-medium">Total Tasks</span>
                    <CheckSquare className="w-4 h-4 text-primary-500" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">48</div>
                  <span className="text-[11px] text-emerald-600 font-medium">↑ 12% vs last sprint</span>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-xs font-medium">Completed</span>
                    <Badge variant="success" size="sm">82%</Badge>
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">39</div>
                  <span className="text-[11px] text-slate-500">9 in progress</span>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-xs font-medium">Active Members</span>
                    <Users className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">7</div>
                  <span className="text-[11px] text-slate-500">Across 3 time zones</span>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="text-xs font-medium">Overdue Rate</span>
                    <Clock className="w-4 h-4 text-rose-500" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">0%</div>
                  <span className="text-[11px] text-emerald-600 font-medium">On schedule</span>
                </div>
              </div>

              {/* Progress bars */}
              <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-950/40 space-y-4">
                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Sprint Completion Progress
                </h4>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-3 overflow-hidden flex">
                  <div className="bg-emerald-500 h-full" style={{ width: '65%' }} title="Done (65%)" />
                  <div className="bg-primary-500 h-full" style={{ width: '20%' }} title="In Progress (20%)" />
                  <div className="bg-amber-400 h-full" style={{ width: '15%' }} title="Review (15%)" />
                </div>
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Done (65%)</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary-500" /> In Progress (20%)</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> In Review (15%)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
