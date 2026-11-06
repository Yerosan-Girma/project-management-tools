import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckSquare,
  Search,
  Calendar,
  MessageSquare,
  Loader2,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { taskService } from '../services/task.service';
import { Task, PriorityLevel } from '../../../types/task.types';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { TaskDetailModal } from '../components/TaskDetailModal';

export const MyTasksPage: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadMyTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await taskService.getMyTasks();
      setTasks(res.items || []);
    } catch {
      toast.error('Failed to load your assigned tasks');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMyTasks();
  }, [loadMyTasks]);

  const filteredTasks = tasks.filter((task) => {
    if (priorityFilter !== 'ALL' && task.priority !== priorityFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      task.title.toLowerCase().includes(q) ||
      (task.project?.name && task.project.name.toLowerCase().includes(q)) ||
      (task.project?.key && task.project.key.toLowerCase().includes(q))
    );
  });

  const getPriorityVariant = (priority: PriorityLevel) => {
    switch (priority) {
      case 'URGENT':
        return 'danger';
      case 'HIGH':
        return 'warning';
      case 'MEDIUM':
        return 'primary';
      default:
        return 'default';
    }
  };

  const handleOpenTask = (task: Task) => {
    setSelectedTaskId(task.id);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          My Tasks
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Deliverables assigned to you across all projects and workspaces.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search your assigned tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            startIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="w-44">
          <Select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            options={[
              { value: 'ALL', label: 'All Priorities' },
              { value: 'LOW', label: 'Low' },
              { value: 'MEDIUM', label: 'Medium' },
              { value: 'HIGH', label: 'High' },
              { value: 'URGENT', label: 'Urgent' },
            ]}
          />
        </div>
      </div>

      {/* Tasks Table / Card List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-2" />
          <span className="text-xs">Loading assigned tasks...</span>
        </div>
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="w-6 h-6" />}
          title={searchQuery ? 'No matching tasks' : 'All caught up!'}
          description={
            searchQuery
              ? 'Try modifying your search or filters.'
              : 'You have no assigned tasks pending right now. Great job!'
          }
        />
      ) : (
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          {filteredTasks.map((task) => {
            const isOverdue =
              task.dueDate && new Date(task.dueDate).getTime() < Date.now() && !task.completedAt;

            return (
              <div
                key={task.id}
                onClick={() => handleOpenTask(task)}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <div className="h-8 w-8 rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400 flex items-center justify-center shrink-0">
                    <CheckSquare className="w-4 h-4" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {task.project?.key && (
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                          {task.project.key}
                        </span>
                      )}
                      {task.project?.name && (
                        <span className="text-xs text-slate-500 truncate max-w-xs">
                          {task.project.name}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {task.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <Badge variant={getPriorityVariant(task.priority)} size="sm">
                    {task.priority}
                  </Badge>

                  {task.dueDate && (
                    <span
                      className={`flex items-center gap-1 text-xs font-medium ${
                        isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'
                      }`}
                    >
                      {isOverdue ? <Clock className="w-3.5 h-3.5 animate-pulse" /> : <Calendar className="w-3.5 h-3.5" />}
                      <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    </span>
                  )}

                  {(task._count?.comments ?? 0) > 0 && (
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{task._count?.comments}</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Modal */}
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
