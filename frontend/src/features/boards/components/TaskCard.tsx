import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, MessageSquare, Clock } from 'lucide-react';
import { Task, PriorityLevel } from '../../../types/task.types';
import { Badge } from '../../../components/ui/Badge';
import { Avatar } from '../../../components/ui/Avatar';

export interface TaskCardProps {
  task: Task;
  projectKey?: string;
  onSelect: (task: Task) => void;
  isOverlay?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  projectKey,
  onSelect,
  isOverlay = false,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'Task',
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

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

  const isOverdue =
    task.dueDate && new Date(task.dueDate).getTime() < Date.now() && !task.completedAt;

  const displayCode = task.code || (projectKey ? `${projectKey}-${task.position + 1}` : undefined);

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => onSelect(task)}
      className={`group relative rounded-xl border bg-white p-3.5 shadow-xs transition-all duration-150 cursor-grab active:cursor-grabbing hover:border-slate-300 dark:bg-slate-900 dark:border-slate-800 dark:hover:border-slate-700 ${
        isDragging ? 'opacity-30 border-dashed border-primary-500' : ''
      } ${isOverlay ? 'shadow-2xl ring-2 ring-primary-500 rotate-1 cursor-grabbing' : ''}`}
    >
      {/* Top Header: Code & Priority */}
      <div className="flex items-center justify-between gap-2 mb-2">
        {displayCode ? (
          <span className="font-mono text-[10px] font-semibold text-slate-400 group-hover:text-primary-600 transition-colors">
            {displayCode}
          </span>
        ) : (
          <span className="font-mono text-[10px] text-slate-400">#task</span>
        )}

        <Badge variant={getPriorityVariant(task.priority)} size="sm">
          {task.priority}
        </Badge>
      </div>

      {/* Task Title */}
      <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-2 leading-relaxed">
        {task.title}
      </h4>

      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {task.labels.map((item, idx) => (
            <span
              key={idx}
              className="text-[10px] px-1.5 py-0.5 rounded font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
            >
              {item.label?.name || 'Tag'}
            </span>
          ))}
        </div>
      )}

      {/* Footer: Due date, comments, assignees */}
      <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400">
        <div className="flex items-center gap-2.5">
          {task.dueDate && (
            <span
              className={`flex items-center gap-1 font-medium ${
                isOverdue
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
              title={isOverdue ? 'Overdue!' : 'Due date'}
            >
              {isOverdue ? <AlertClockIcon /> : <Calendar className="w-3 h-3" />}
              <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
            </span>
          )}

          {(task._count?.comments ?? 0) > 0 && (
            <span className="flex items-center gap-1 text-slate-500">
              <MessageSquare className="w-3 h-3" />
              <span>{task._count?.comments}</span>
            </span>
          )}
        </div>

        {/* Assignees */}
        {task.assignees && task.assignees.length > 0 && (
          <div className="flex -space-x-1.5 overflow-hidden">
            {task.assignees.slice(0, 3).map((assignee) => (
              <Avatar
                key={assignee.id}
                src={assignee.user?.avatarUrl}
                name={assignee.user?.name}
                size="xs"
                className="ring-1 ring-white dark:ring-slate-900"
              />
            ))}
            {task.assignees.length > 3 && (
              <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[9px] font-bold flex items-center justify-center ring-1 ring-white dark:ring-slate-900">
                +{task.assignees.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const AlertClockIcon = () => (
  <Clock className="w-3 h-3 text-rose-500 animate-pulse" />
);

export default TaskCard;
