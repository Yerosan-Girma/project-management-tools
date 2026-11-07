import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { boardService } from '../services/board.service';
import { taskService } from '../../tasks/services/task.service';
import { Board, BoardColumn } from '../../../types/board.types';
import { Task } from '../../../types/task.types';
import { ProjectMember } from '../../../types/project.types';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { CreateTaskModal } from '../../tasks/components/CreateTaskModal';
import { TaskDetailModal } from '../../tasks/components/TaskDetailModal';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';

export interface KanbanBoardProps {
  projectId: string;
  projectKey: string;
  projectMembers?: ProjectMember[];
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  projectId,
  projectKey,
  projectMembers = [],
}) => {
  const [board, setBoard] = useState<Board | null>(null);
  const [columns, setColumns] = useState<BoardColumn[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [createTaskColumnId, setCreateTaskColumnId] = useState<string | undefined>();

  // Add / Edit Column modal
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<BoardColumn | null>(null);
  const [columnName, setColumnName] = useState('');
  const [columnColor, setColumnColor] = useState('#6366f1');
  const [columnLimit, setColumnLimit] = useState<number | undefined>();

  // DND Sensors with 5px distance constraint to prevent accidental drags on clicks
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const loadBoardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [boardsData, tasksData] = await Promise.all([
        boardService.getProjectBoards(projectId),
        taskService.getProjectTasks(projectId),
      ]);

      const primaryBoard = boardsData[0] || null;
      setBoard(primaryBoard);
      if (primaryBoard) {
        setColumns(primaryBoard.columns?.sort((a, b) => a.position - b.position) || []);
      }
      const safeTasksList: Task[] = Array.isArray(tasksData)
        ? tasksData
        : (tasksData as any)?.items || [];
      setTasks(safeTasksList.sort((a, b) => a.position - b.position));
    } catch {
      toast.error('Failed to load board tasks');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadBoardData();
  }, [loadBoardData]);

  // Tasks mapped by column ID
  const tasksByColumn = useMemo(() => {
    const map = new Map<string, Task[]>();
    columns.forEach((col) => map.set(col.id, []));
    tasks.forEach((task) => {
      const colId = task.boardColumnId || task.columnId;
      if (colId && map.has(colId)) {
        map.get(colId)!.push(task);
      }
    });
    // Sort each list by task.position
    map.forEach((list) => list.sort((a, b) => a.position - b.position));
    return map;
  }, [columns, tasks]);

  // Drag handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    if (activeId === overId) return;

    const activeTaskItem = tasks.find((t) => t.id === activeId);
    if (!activeTaskItem) return;

    // Check if over a column or over another task
    const isOverColumn = columns.some((c) => c.id === overId);
    const overTask = tasks.find((t) => t.id === overId);

    const targetColumnId = isOverColumn ? overId : overTask?.boardColumnId;
    if (!targetColumnId) return;

    if (activeTaskItem.boardColumnId !== targetColumnId) {
      // Optimistically move task to target column
      setTasks((prevTasks) =>
        prevTasks.map((t) =>
          t.id === activeId ? { ...t, boardColumnId: targetColumnId } : t
        )
      );
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    const activeTaskItem = tasks.find((t) => t.id === activeId);
    if (!activeTaskItem) return;

    // Determine target column and new position index
    const isOverColumn = columns.some((c) => c.id === overId);
    const overTask = tasks.find((t) => t.id === overId);

    const targetColumnId = isOverColumn ? overId : overTask?.boardColumnId || activeTaskItem.boardColumnId;
    const columnTasks = tasks.filter((t) => t.boardColumnId === targetColumnId);

    let newIndex = 0;
    if (isOverColumn) {
      newIndex = columnTasks.length > 0 ? columnTasks.length - 1 : 0;
    } else if (overTask) {
      const activeIdx = columnTasks.findIndex((t) => t.id === activeId);
      const overIdx = columnTasks.findIndex((t) => t.id === overId);
      if (activeIdx !== -1 && overIdx !== -1) {
        newIndex = overIdx;
        const reordered = arrayMove(columnTasks, activeIdx, overIdx);
        setTasks((prev) => [
          ...prev.filter((t) => t.boardColumnId !== targetColumnId),
          ...reordered,
        ]);
      }
    }

    try {
      await taskService.moveTask(activeId, targetColumnId, newIndex);
    } catch {
      toast.error('Failed to update task position. Reverting...');
      loadBoardData();
    }
  };

  // Column Actions
  const handleOpenAddColumn = () => {
    setEditingColumn(null);
    setColumnName('');
    setColumnColor('#6366f1');
    setColumnLimit(undefined);
    setIsColumnModalOpen(true);
  };

  const handleOpenEditColumn = (col: BoardColumn) => {
    setEditingColumn(col);
    setColumnName(col.name);
    setColumnColor(col.color || '#6366f1');
    setColumnLimit(col.taskLimit || undefined);
    setIsColumnModalOpen(true);
  };

  const handleSaveColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!board || !columnName.trim()) return;

    try {
      if (editingColumn) {
        const updated = await boardService.updateColumn(editingColumn.id, {
          name: columnName.trim(),
          color: columnColor,
          taskLimit: columnLimit || null,
        });
        setColumns((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
        toast.success('Column updated');
      } else {
        const newCol = await boardService.createColumn({
          boardId: board.id,
          name: columnName.trim(),
          color: columnColor,
          taskLimit: columnLimit || null,
          position: columns.length,
        });
        setColumns((prev) => [...prev, newCol]);
        toast.success(`Column "${newCol.name}" added`);
      }
      setIsColumnModalOpen(false);
    } catch {
      toast.error('Failed to save column');
    }
  };

  const handleDeleteColumn = async (columnId: string) => {
    if (columns.length <= 1) {
      toast.error('Cannot delete the last remaining column on the board');
      return;
    }
    const targetCol = columns.find((c) => c.id !== columnId);
    if (!confirm(`Delete this column? Tasks will be relocated to "${targetCol?.name}".`)) {
      return;
    }

    try {
      await boardService.deleteColumn(columnId, targetCol?.id);
      toast.success('Column deleted');
      loadBoardData();
    } catch {
      toast.error('Failed to delete column');
    }
  };

  const handleOpenAddTask = (colId: string) => {
    setCreateTaskColumnId(colId);
    setIsCreateTaskOpen(true);
  };

  const handleSelectTask = (task: Task) => {
    setSelectedTaskId(task.id);
    setIsTaskDetailOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-2" />
        <span className="text-xs">Loading Kanban workspace...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Board Controls Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium">
            {columns.length} Columns • {tasks.length} Total Deliverables
          </span>
        </div>

        <Button
          size="sm"
          variant="outline"
          onClick={handleOpenAddColumn}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Add Column
        </Button>
      </div>

      {/* DND Context & Kanban Horizontal Scroll */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex items-start gap-4 overflow-x-auto pb-6 pt-1 min-h-[500px]">
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={tasksByColumn.get(column.id) || []}
              projectKey={projectKey}
              onSelectTask={handleSelectTask}
              onAddTask={handleOpenAddTask}
              onEditColumn={handleOpenEditColumn}
              onDeleteColumn={handleDeleteColumn}
            />
          ))}

          {/* Quick Add Column Card Button */}
          <button
            type="button"
            onClick={handleOpenAddColumn}
            className="w-80 shrink-0 h-32 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-primary-500 dark:hover:border-primary-500 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 flex flex-col items-center justify-center gap-2 transition-all"
          >
            <Plus className="w-6 h-6" />
            <span className="text-xs font-semibold">Add New Column</span>
          </button>
        </div>

        {/* Drag Overlay for Ghost Animation */}
        <DragOverlay>
          {activeTask ? (
            <TaskCard
              task={activeTask}
              projectKey={projectKey}
              onSelect={() => {}}
              isOverlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        projectId={projectId}
        columns={columns}
        defaultColumnId={createTaskColumnId}
        projectMembers={projectMembers}
        onCreated={loadBoardData}
      />

      {/* Task Detail Modal */}
      <TaskDetailModal
        taskId={selectedTaskId}
        isOpen={isTaskDetailOpen}
        onClose={() => {
          setIsTaskDetailOpen(false);
          setSelectedTaskId(null);
        }}
        columns={columns}
        projectMembers={projectMembers}
        onTaskUpdated={loadBoardData}
        onTaskDeleted={loadBoardData}
      />

      {/* Add / Edit Column Modal */}
      <Modal
        isOpen={isColumnModalOpen}
        onClose={() => setIsColumnModalOpen(false)}
        title={editingColumn ? 'Edit Column' : 'Add New Column'}
        description="Configure workflow stage name, color tag, and work-in-progress limit."
      >
        <form onSubmit={handleSaveColumn} className="space-y-4 pt-2">
          <Input
            label="Column Name"
            placeholder="e.g. In QA Review, Deploying"
            value={columnName}
            onChange={(e) => setColumnName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Stage Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={columnColor}
                  onChange={(e) => setColumnColor(e.target.value)}
                  className="h-9 w-12 rounded border border-slate-300 dark:border-slate-700 cursor-pointer bg-transparent"
                />
                <span className="font-mono text-xs text-slate-500">{columnColor}</span>
              </div>
            </div>

            <Input
              label="WIP Task Limit (Optional)"
              type="number"
              min={1}
              placeholder="e.g. 5"
              value={columnLimit ?? ''}
              onChange={(e) => setColumnLimit(e.target.value ? parseInt(e.target.value, 10) : undefined)}
              helperText="Warns when tasks exceed this capacity"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="outline" onClick={() => setIsColumnModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {editingColumn ? 'Save Changes' : 'Create Column'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default KanbanBoard;
