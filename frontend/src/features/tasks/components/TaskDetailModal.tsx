import React, { useState, useEffect } from 'react';
import {
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Avatar } from '../../../components/ui/Avatar';
import { TaskComments } from '../../comments/components/TaskComments';
import { taskService } from '../services/task.service';
import { Task, PriorityLevel } from '../../../types/task.types';
import { BoardColumn } from '../../../types/board.types';
import { ProjectMember } from '../../../types/project.types';

export interface TaskDetailModalProps {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
  columns?: BoardColumn[];
  projectMembers?: ProjectMember[];
  onTaskUpdated?: () => void;
  onTaskDeleted?: () => void;
  isReadOnly?: boolean;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  taskId,
  isOpen,
  onClose,
  columns = [],
  projectMembers = [],
  onTaskUpdated,
  onTaskDeleted,
  isReadOnly = false,
}) => {
  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [newLabelInput, setNewLabelInput] = useState('');

  useEffect(() => {
    if (!taskId || !isOpen) {
      setTask(null);
      return;
    }

    const loadTask = async () => {
      try {
        setIsLoading(true);
        const data = await taskService.getTask(taskId);
        setTask(data);
        setTitle(data.title);
        setDescription(data.description || '');
      } catch {
        toast.error('Failed to load task details');
        onClose();
      } finally {
        setIsLoading(false);
      }
    };

    loadTask();
  }, [taskId, isOpen, onClose]);

  if (!isOpen || !taskId) return null;

  const handleUpdateField = async (fields: Parameters<typeof taskService.updateTask>[1]) => {
    if (!task) return;
    try {
      const updated = await taskService.updateTask(task.id, fields);
      setTask(updated);
      toast.success('Task updated');
      onTaskUpdated?.();
    } catch {
      toast.error('Failed to update task');
    }
  };

  const handleSaveTitle = async () => {
    if (!title.trim() || title === task?.title) {
      setIsEditingTitle(false);
      return;
    }
    await handleUpdateField({ title: title.trim() });
    setIsEditingTitle(false);
  };

  const handleSaveDescription = async () => {
    if (description === task?.description) return;
    await handleUpdateField({ description: description.trim() || null });
  };

  const handleAssignUser = async (userId: string) => {
    if (!task) return;
    try {
      const updated = await taskService.assignUsers(task.id, [userId]);
      setTask(updated);
      toast.success('Teammate assigned');
      onTaskUpdated?.();
    } catch {
      toast.error('Failed to assign teammate');
    }
  };

  const handleUnassignUser = async (userId: string) => {
    if (!task) return;
    try {
      await taskService.unassignUser(task.id, userId);
      setTask((prev) =>
        prev
          ? {
              ...prev,
              assignees: prev.assignees?.filter((a) => a.userId !== userId),
            }
          : null
      );
      toast.success('Teammate unassigned');
      onTaskUpdated?.();
    } catch {
      toast.error('Failed to unassign user');
    }
  };

  const handleAddLabel = async () => {
    if (!task || !newLabelInput.trim()) return;
    const existing = (task.labels || []).map((l) => l.label.name);
    if (existing.includes(newLabelInput.trim())) {
      setNewLabelInput('');
      return;
    }
    const updatedLabels = [...existing, newLabelInput.trim()];
    try {
      const updated = await taskService.setLabels(task.id, updatedLabels);
      setTask(updated);
      setNewLabelInput('');
      toast.success('Label added');
      onTaskUpdated?.();
    } catch {
      toast.error('Failed to add label');
    }
  };

  const handleRemoveLabel = async (labelName: string) => {
    if (!task) return;
    const updatedLabels = (task.labels || [])
      .map((l) => l.label.name)
      .filter((name) => name !== labelName);
    try {
      const updated = await taskService.setLabels(task.id, updatedLabels);
      setTask(updated);
      toast.success('Label removed');
      onTaskUpdated?.();
    } catch {
      toast.error('Failed to remove label');
    }
  };

  const handleDeleteTask = async () => {
    if (!task) return;
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await taskService.archiveTask(task.id);
      toast.success('Task archived/deleted');
      onClose();
      onTaskDeleted?.();
    } catch {
      toast.error('Failed to delete task');
    }
  };

  const unassignedMembers = projectMembers.filter(
    (pm) => !task?.assignees?.some((a) => a.userId === pm.userId)
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      title={
        <div className="flex items-center gap-2">
          {task?.project?.key && (
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {task.project.key}
            </span>
          )}
          <span className="text-xs text-slate-400">Created {task ? new Date(task.createdAt).toLocaleDateString() : ''}</span>
        </div>
      }
    >
      {isLoading || !task ? (
        <div className="py-12 text-center text-xs text-slate-500">
          Loading task details...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Title Area */}
          <div>
            {!isReadOnly && isEditingTitle ? (
              <div className="flex items-center gap-2">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                  autoFocus
                />
                <Button size="sm" onClick={handleSaveTitle}>
                  Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setIsEditingTitle(false)}>
                  Cancel
                </Button>
              </div>
            ) : (
              <h2
                onClick={() => !isReadOnly && setIsEditingTitle(true)}
                className={`text-lg font-bold text-slate-900 dark:text-white ${
                  !isReadOnly ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 p-1.5 -m-1.5 rounded-lg' : ''
                } transition-colors`}
                title={!isReadOnly ? 'Click to edit title' : undefined}
              >
                {task.title}
              </h2>
            )}
          </div>

          {/* Quick Properties Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800">
            {/* Column Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Column Stage
              </label>
              <select
                disabled={isReadOnly}
                value={task.boardColumnId}
                onChange={(e) => handleUpdateField({ boardColumnId: e.target.value })}
                className="w-full text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {columns.map((col) => (
                  <option key={col.id} value={col.id}>
                    {col.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Priority
              </label>
              <select
                disabled={isReadOnly}
                value={task.priority}
                onChange={(e) => handleUpdateField({ priority: e.target.value as PriorityLevel })}
                className="w-full text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Due Date
              </label>
              <input
                type="date"
                disabled={isReadOnly}
                value={task.dueDate ? task.dueDate.slice(0, 10) : ''}
                onChange={(e) =>
                  handleUpdateField({
                    dueDate: e.target.value ? new Date(e.target.value).toISOString() : null,
                  })
                }
                className="w-full text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Description
            </label>
            <Textarea
              rows={4}
              disabled={isReadOnly}
              placeholder="Describe deliverables, technical requirements, or steps..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={() => !isReadOnly && handleSaveDescription()}
            />
          </div>

          {/* Assignees Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Assigned Teammates
              </label>
              {unassignedMembers.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAssignUser(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    defaultValue=""
                    className="text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1"
                  >
                    <option value="" disabled>
                      + Assign Member...
                    </option>
                    {unassignedMembers.map((m) => (
                      <option key={m.userId} value={m.userId}>
                        {m.user?.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {task.assignees && task.assignees.length > 0 ? (
                task.assignees.map((a) => (
                  <div
                    key={a.id}
                    className="inline-flex items-center gap-2 rounded-full bg-slate-100 dark:bg-slate-800 pr-2 pl-1 py-1 text-xs"
                  >
                    <Avatar src={a.user?.avatarUrl} name={a.user?.name} size="xs" />
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {a.user?.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUnassignUser(a.userId)}
                      className="text-slate-400 hover:text-rose-500 rounded-full p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))
              ) : (
                <span className="text-xs text-slate-400 italic">No assignees yet</span>
              )}
            </div>
          </div>

          {/* Labels Section */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Labels
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {task.labels &&
                task.labels.map((item, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300 border border-primary-200 dark:border-primary-800"
                  >
                    {item.label?.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveLabel(item.label?.name)}
                      className="hover:text-rose-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

              <div className="flex items-center gap-1">
                <input
                  type="text"
                  placeholder="New label..."
                  value={newLabelInput}
                  onChange={(e) => setNewLabelInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddLabel()}
                  className="text-xs px-2.5 py-1 rounded-full border border-slate-300 dark:border-slate-700 bg-transparent w-28 focus:w-36 transition-all"
                />
                <Button size="sm" variant="ghost" onClick={handleAddLabel}>
                  Add
                </Button>
              </div>
            </div>
          </div>

          {/* Threaded Discussion */}
          <TaskComments taskId={task.id} />

          {/* Footer Delete Action */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            {!isReadOnly ? (
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteTask}
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                Delete Task
              </Button>
            ) : (
              <div />
            )}

            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default TaskDetailModal;
