import React, { useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckSquare,
  Search,
  Calendar,
  MessageSquare,
  Loader2,
  Clock,
  Kanban,
  List as ListIcon,
  CheckCircle2,
  Square,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { taskService } from '../services/task.service';
import { boardService } from '../../boards/services/board.service';
import { Task } from '../../../types/task.types';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { TaskDetailModal } from '../components/TaskDetailModal';

type ViewMode = 'list' | 'board';
type SortField = 'dueDate' | 'priority' | 'title';

export const MyTasksPage: React.FC = () => {
  const queryClient = useQueryClient();

  // Filters & Views
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE'>('ALL');
  const [sortField, setSortField] = useState<SortField>('dueDate');

  // Modal
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['my-tasks'],
    queryFn: async () => {
      const res = await taskService.getMyTasks();
      return Array.isArray(res) ? res : (res?.items || []);
    },
    staleTime: 1000 * 30,
    placeholderData: (previousData) => previousData,
  });

  const loadMyTasks = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['my-tasks'] });
  }, [queryClient]);

  // Quick toggle task completion
  const handleToggleTask = async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const isCompleted = Boolean(task.column?.isCompletedColumn || task.completedAt);
      const boards = await boardService.getProjectBoards(task.projectId);
      if (!boards.length || !boards[0].columns?.length) return;

      const columns = boards[0].columns;
      const targetCol = !isCompleted
        ? columns.find((c) => c.isCompletedColumn) || columns[columns.length - 1]
        : columns.find((c) => !c.isCompletedColumn) || columns[0];

      queryClient.setQueryData<Task[]>(['my-tasks'], (prev = []) =>
        prev.map((t) =>
          t.id === task.id
            ? ({
                ...t,
                completedAt: !isCompleted ? new Date().toISOString() : null,
                column: {
                  ...t.column,
                  id: targetCol.id,
                  name: !isCompleted ? 'Completed' : 'In Progress',
                  isCompletedColumn: !isCompleted,
                } as any,
              } as Task)
            : t
        )
      );

      await taskService.updateTask(task.id, { boardColumnId: targetCol.id });
      toast.success(!isCompleted ? 'Task completed! 🎉' : 'Task reopened');
    } catch {
      toast.error('Failed to update task');
      loadMyTasks();
    }
  };

  // Filtered and Sorted Tasks
  const filteredTasks = useMemo(() => {
    const now = Date.now();

    return tasks
      .filter((task) => {
        // Priority
        if (priorityFilter !== 'ALL' && task.priority !== priorityFilter) return false;

        // Status
        const isCompleted = Boolean(task.column?.isCompletedColumn || task.completedAt);
        const isOverdue =
          !isCompleted && task.dueDate && new Date(task.dueDate).getTime() < now;

        if (statusFilter === 'COMPLETED' && !isCompleted) return false;
        if (statusFilter === 'IN_PROGRESS' && isCompleted) return false;
        if (statusFilter === 'OVERDUE' && !isOverdue) return false;

        // Search query
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          task.title.toLowerCase().includes(q) ||
          (task.project?.name && task.project.name.toLowerCase().includes(q)) ||
          (task.project?.key && task.project.key.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (sortField === 'dueDate') {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        }
        if (sortField === 'priority') {
          const priorityWeights: Record<string, number> = {
            URGENT: 4,
            HIGH: 3,
            MEDIUM: 2,
            LOW: 1,
          };
          return (priorityWeights[b.priority] || 0) - (priorityWeights[a.priority] || 0);
        }
        return a.title.localeCompare(b.title);
      });
  }, [tasks, priorityFilter, statusFilter, searchQuery, sortField]);

  // Counts
  const stats = useMemo(() => {
    const now = Date.now();
    const completed = tasks.filter((t) => t.column?.isCompletedColumn || t.completedAt).length;
    const inFlight = tasks.length - completed;
    const overdue = tasks.filter(
      (t) => !(t.column?.isCompletedColumn || t.completedAt) && t.dueDate && new Date(t.dueDate).getTime() < now
    ).length;
    return { total: tasks.length, inFlight, completed, overdue };
  }, [tasks]);

  // Tasks grouped for Board View
  const boardColumns = useMemo(() => {
    return [
      {
        id: 'todo',
        name: 'To Do',
        tasks: filteredTasks.filter(
          (t) =>
            !t.completedAt &&
            !t.column?.isCompletedColumn &&
            (t.column?.name?.toLowerCase().includes('to do') ||
              t.column?.name?.toLowerCase().includes('backlog') ||
              (!t.column?.name?.toLowerCase().includes('progress') &&
                !t.column?.name?.toLowerCase().includes('review')))
        ),
      },
      {
        id: 'in_progress',
        name: 'In Progress',
        tasks: filteredTasks.filter(
          (t) =>
            !t.completedAt &&
            !t.column?.isCompletedColumn &&
            t.column?.name?.toLowerCase().includes('progress')
        ),
      },
      {
        id: 'review',
        name: 'In Review',
        tasks: filteredTasks.filter(
          (t) =>
            !t.completedAt &&
            !t.column?.isCompletedColumn &&
            t.column?.name?.toLowerCase().includes('review')
        ),
      },
      {
        id: 'completed',
        name: 'Completed',
        tasks: filteredTasks.filter((t) => t.completedAt || t.column?.isCompletedColumn),
      },
    ];
  }, [filteredTasks]);

  const handleOpenTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            My Tasks
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Deliverables and milestones assigned directly to you across all projects.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start sm:self-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'list'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <ListIcon className="w-3.5 h-3.5" />
            <span>List</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('board')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              viewMode === 'board'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Board</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setStatusFilter('ALL')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'ALL'
              ? 'bg-primary-50/70 border-primary-300 dark:bg-primary-950/40 dark:border-primary-800'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <span className="text-[11px] font-medium text-slate-500">All Assigned</span>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{stats.total}</p>
        </button>

        <button
          onClick={() => setStatusFilter('IN_PROGRESS')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'IN_PROGRESS'
              ? 'bg-blue-50/70 border-blue-300 dark:bg-blue-950/40 dark:border-blue-800'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <span className="text-[11px] font-medium text-slate-500">In Flight</span>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">{stats.inFlight}</p>
        </button>

        <button
          onClick={() => setStatusFilter('COMPLETED')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'COMPLETED'
              ? 'bg-emerald-50/70 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <span className="text-[11px] font-medium text-slate-500">Completed</span>
          <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
            {stats.completed}
          </p>
        </button>

        <button
          onClick={() => setStatusFilter('OVERDUE')}
          className={`p-3 rounded-xl border text-left transition-all ${
            statusFilter === 'OVERDUE'
              ? 'bg-rose-50/70 border-rose-300 dark:bg-rose-950/40 dark:border-rose-800'
              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
          }`}
        >
          <span className="text-[11px] font-medium text-slate-500">Overdue</span>
          <p
            className={`text-xl font-bold mt-0.5 ${
              stats.overdue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
            }`}
          >
            {stats.overdue}
          </p>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search deliverables by name or project key..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            startIcon={<Search className="w-4 h-4 text-slate-400" />}
            className="text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Priority filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-slate-800 dark:text-slate-200"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Sort field */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400">Sort:</span>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as SortField)}
              className="text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-slate-800 dark:text-slate-200"
            >
              <option value="dueDate">Due Date</option>
              <option value="priority">Priority</option>
              <option value="title">Title</option>
            </select>
          </div>
        </div>
      </div>

      {/* VIEW CONTENT */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-2" />
          <span className="text-xs">Loading assigned tasks...</span>
        </div>
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="w-6 h-6" />}
          title={searchQuery || priorityFilter !== 'ALL' ? 'No matching deliverables' : 'All caught up!'}
          description={
            searchQuery || priorityFilter !== 'ALL'
              ? 'Try modifying your search or reset the active filter.'
              : 'You have no assigned tasks pending right now. Great job!'
          }
        />
      ) : viewMode === 'list' ? (
        /* 1. LIST VIEW (Structured Table) */
        <div className="rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-xs divide-y divide-slate-100 dark:divide-slate-800">
          {filteredTasks.map((task) => {
            const isCompleted = Boolean(task.column?.isCompletedColumn || task.completedAt);
            const isOverdue =
              !isCompleted &&
              task.dueDate &&
              new Date(task.dueDate).getTime() < Date.now();

            return (
              <div
                key={task.id}
                onClick={() => handleOpenTask(task.id)}
                className={`p-4 flex items-center justify-between gap-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors group ${
                  isCompleted ? 'opacity-65' : ''
                }`}
              >
                {/* Left: Checkbox + Title + Project */}
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={(e) => handleToggleTask(task, e)}
                    className="shrink-0 text-slate-400 hover:text-primary-600 transition-colors"
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-100 dark:fill-emerald-950" />
                    ) : (
                      <Square className="w-5 h-5 group-hover:border-primary-500" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {task.project?.key && (
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {task.project.key}
                        </span>
                      )}
                      {task.project?.name && (
                        <span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">
                          {task.project.name}
                        </span>
                      )}
                      {task.column?.name && (
                        <span
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: `${task.column.color || '#3b82f6'}15`,
                            color: task.column.color || '#3b82f6',
                          }}
                        >
                          {task.column.name}
                        </span>
                      )}
                    </div>
                    <h3
                      className={`text-sm font-semibold truncate ${
                        isCompleted
                          ? 'line-through text-slate-400'
                          : 'text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400'
                      }`}
                    >
                      {task.title}
                    </h3>
                  </div>
                </div>

                {/* Right: Badges, Due Date, Comments, Chevron */}
                <div className="flex items-center gap-3 shrink-0">
                  <Badge
                    variant={
                      task.priority === 'URGENT'
                        ? 'danger'
                        : task.priority === 'HIGH'
                        ? 'warning'
                        : task.priority === 'MEDIUM'
                        ? 'primary'
                        : 'default'
                    }
                    size="sm"
                  >
                    {task.priority}
                  </Badge>

                  {task.dueDate && (
                    <span
                      className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md ${
                        isOverdue
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                          : 'text-slate-500 bg-slate-100/60 dark:bg-slate-800/60'
                      }`}
                    >
                      <Clock className={`w-3.5 h-3.5 ${isOverdue ? 'animate-pulse' : ''}`} />
                      <span>
                        {new Date(task.dueDate).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </span>
                  )}

                  {(task._count?.comments ?? 0) > 0 && (
                    <span className="flex items-center gap-1 text-xs text-slate-400 hidden sm:flex">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{task._count?.comments}</span>
                    </span>
                  )}

                  <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* 2. BOARD VIEW (Personal Kanban Columns) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {boardColumns.map((col) => (
            <div
              key={col.id}
              className="rounded-2xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 p-3 space-y-3"
            >
              <div className="flex items-center justify-between px-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                <span>{col.name}</span>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-500">
                  {col.tasks.length}
                </span>
              </div>

              <div className="space-y-2 min-h-[120px]">
                {col.tasks.length === 0 ? (
                  <p className="py-6 text-center text-[11px] text-slate-400 italic">No tasks</p>
                ) : (
                  col.tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => handleOpenTask(task.id)}
                      className="p-3.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200/70 dark:border-slate-700/80 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer space-y-2"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-mono text-[10px] font-bold text-slate-400">
                          {task.project?.key}
                        </span>
                        <Badge
                          variant={task.priority === 'URGENT' ? 'danger' : 'default'}
                          size="sm"
                        >
                          {task.priority}
                        </Badge>
                      </div>

                      <h4 className="text-xs font-semibold text-slate-900 dark:text-white line-clamp-2">
                        {task.title}
                      </h4>

                      {task.dueDate && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-700/50">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Task Detail Modal */}
      <TaskDetailModal
        taskId={selectedTaskId}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTaskId(null);
        }}
        onTaskUpdated={loadMyTasks}
        onTaskDeleted={loadMyTasks}
      />
    </div>
  );
};

export default MyTasksPage;
