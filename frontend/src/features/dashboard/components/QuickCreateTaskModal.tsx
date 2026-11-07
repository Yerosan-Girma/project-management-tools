import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { taskService } from '../../tasks/services/task.service';
import { boardService } from '../../boards/services/board.service';
import { Project, PriorityLevel } from '../../../types/project.types';
import { BoardColumn } from '../../../types/board.types';

export interface QuickCreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onCreated: () => void;
  currentUserId?: string;
}

export const QuickCreateTaskModal: React.FC<QuickCreateTaskModalProps> = ({
  isOpen,
  onClose,
  projects,
  onCreated,
  currentUserId,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [columns, setColumns] = useState<BoardColumn[]>([]);
  const [selectedColumnId, setSelectedColumnId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('MEDIUM');
  const [dueDate, setDueDate] = useState('');
  const [assignToMe, setAssignToMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingColumns, setIsLoadingColumns] = useState(false);

  // Set default project when opened
  useEffect(() => {
    if (isOpen && projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
  }, [isOpen, projects, selectedProjectId]);

  // Load project columns when selected project changes
  useEffect(() => {
    if (!selectedProjectId) return;

    let isMounted = true;
    const fetchColumns = async () => {
      try {
        setIsLoadingColumns(true);
        const boards = await boardService.getProjectBoards(selectedProjectId);
        if (!isMounted) return;

        if (boards.length > 0 && boards[0].columns && boards[0].columns.length > 0) {
          const sortedCols = [...boards[0].columns].sort((a, b) => a.position - b.position);
          setColumns(sortedCols);
          setSelectedColumnId(sortedCols[0].id);
        } else {
          setColumns([]);
          setSelectedColumnId('');
        }
      } catch {
        if (isMounted) {
          setColumns([]);
          setSelectedColumnId('');
        }
      } finally {
        if (isMounted) {
          setIsLoadingColumns(false);
        }
      }
    };

    fetchColumns();
    return () => {
      isMounted = false;
    };
  }, [selectedProjectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Please enter a task title');
      return;
    }
    if (!selectedProjectId) {
      toast.error('Please select a project');
      return;
    }
    if (!selectedColumnId) {
      toast.error('No columns available in this project');
      return;
    }

    try {
      setIsSubmitting(true);
      await taskService.createTask({
        projectId: selectedProjectId,
        boardColumnId: selectedColumnId,
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        assigneeIds: assignToMe && currentUserId ? [currentUserId] : undefined,
      });

      toast.success('Task created successfully! 🎉');
      // Reset form
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setDueDate('');
      onClose();
      onCreated();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to create task';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Task" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Project Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Project <span className="text-rose-500">*</span>
          </label>
          <Select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            options={projects.map((p) => ({
              value: p.id,
              label: `${p.name} (${p.key})`,
            }))}
            disabled={projects.length === 0}
          />
          {projects.length === 0 && (
            <p className="text-[11px] text-amber-500 mt-1">
              No projects found in this workspace. Please create a project first.
            </p>
          )}
        </div>

        {/* Task Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Task Title <span className="text-rose-500">*</span>
          </label>
          <Input
            placeholder="e.g. Implement user permission model..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Description
          </label>
          <Textarea
            placeholder="Add context, acceptance criteria, or links..."
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Priority & Column */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Priority
            </label>
            <Select
              value={priority}
              onChange={(e) => setPriority(e.target.value as PriorityLevel)}
              options={[
                { value: 'LOW', label: '🟢 Low' },
                { value: 'MEDIUM', label: '🔵 Medium' },
                { value: 'HIGH', label: '🟠 High' },
                { value: 'URGENT', label: '🔴 Urgent' },
              ]}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Initial Stage
            </label>
            <Select
              value={selectedColumnId}
              onChange={(e) => setSelectedColumnId(e.target.value)}
              options={columns.map((c) => ({
                value: c.id,
                label: c.name,
              }))}
              disabled={isLoadingColumns || columns.length === 0}
            />
          </div>
        </div>

        {/* Due Date & Assignment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Due Date
            </label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="flex items-center pt-5">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
              <input
                type="checkbox"
                checked={assignToMe}
                onChange={(e) => setAssignToMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <span>Assign to me immediately</span>
            </label>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
          <Button variant="ghost" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            isLoading={isSubmitting}
            disabled={projects.length === 0 || !title.trim()}
          >
            Create Task
          </Button>
        </div>
      </form>
    </Modal>
  );
};
