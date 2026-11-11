import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Plus, MoreHorizontal, Edit2, Trash2 } from 'lucide-react';
import { BoardColumn } from '../../../types/board.types';
import { Task } from '../../../types/task.types';
import { TaskCard } from './TaskCard';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';

export interface KanbanColumnProps {
  column: BoardColumn;
  tasks: Task[];
  projectKey?: string;
  onSelectTask: (task: Task) => void;
  onAddTask: (columnId: string) => void;
  onEditColumn: (column: BoardColumn) => void;
  onDeleteColumn: (columnId: string) => void;
  isReadOnly?: boolean;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
  column,
  tasks,
  projectKey,
  onSelectTask,
  onAddTask,
  onEditColumn,
  onDeleteColumn,
  isReadOnly = false,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    disabled: isReadOnly,
    data: {
      type: 'Column',
      column,
    },
  });

  const [menuOpen, setMenuOpen] = useState(false);
  const taskIds = tasks.map((t) => t.id);

  const columnColor = column.color || '#6366f1';
  const isLimitReached = column.taskLimit && tasks.length >= column.taskLimit;

  return (
    <div
      ref={setNodeRef}
      className={`w-[85vw] sm:w-80 shrink-0 snap-center flex flex-col rounded-2xl bg-slate-100/70 p-3 dark:bg-slate-900/50 border transition-colors ${
        isOver
          ? 'border-primary-500/80 bg-primary-50/30 dark:bg-primary-950/20'
          : 'border-slate-200/80 dark:border-slate-800'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 px-1 relative">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: columnColor }}
          />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 truncate">
            {column.name}
          </h3>
          <Badge
            variant={isLimitReached ? 'warning' : 'default'}
            size="sm"
          >
            {column.taskLimit ? `${tasks.length}/${column.taskLimit}` : tasks.length}
          </Badge>
        </div>

        {!isReadOnly && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onAddTask(column.id)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
              title="Add task to column"
            >
              <Plus className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Column Options Menu */}
        {menuOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
            <div className="absolute right-0 top-full mt-1 z-40 w-44 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-1 text-xs">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onEditColumn(column);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors text-left"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Edit Column
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onDeleteColumn(column.id);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors text-left"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Column
              </button>
            </div>
          </>
        )}
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5 min-h-[140px] max-h-[calc(100vh-280px)]">
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy} disabled={isReadOnly}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              projectKey={projectKey}
              onSelect={onSelectTask}
              isReadOnly={isReadOnly}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="h-28 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center text-xs text-slate-400">
            No tasks in this stage
          </div>
        )}
      </div>

      {/* Bottom Quick-Add */}
      {!isReadOnly && (
        <div className="pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            onClick={() => onAddTask(column.id)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Task
          </Button>
        </div>
      )}
    </div>
  );
};

export default KanbanColumn;
