import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { taskService } from '../services/task.service';
import { BoardColumn } from '../../../types/board.types';
import { PriorityLevel, ProjectMember } from '../../../types/project.types';

const createTaskSchema = z.object({
  title: z.string().trim().min(2, 'Title must be at least 2 characters').max(150),
  description: z.string().trim().optional(),
  boardColumnId: z.string().uuid('Please select a valid column'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const).default('MEDIUM'),
  dueDate: z.string().optional(),
  startDate: z.string().optional(),
});

type CreateTaskFormData = z.infer<typeof createTaskSchema>;

export interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  columns: BoardColumn[];
  defaultColumnId?: string;
  projectMembers?: ProjectMember[];
  onCreated?: () => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  projectId,
  columns,
  defaultColumnId,
  projectMembers = [],
  onCreated,
}) => {
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
  const [labelsInput, setLabelsInput] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateTaskFormData>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      boardColumnId: defaultColumnId || columns[0]?.id || '',
      priority: 'MEDIUM',
    },
  });

  const toggleAssignee = (userId: string) => {
    setSelectedAssigneeIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const onSubmit = async (data: CreateTaskFormData) => {
    try {
      const parsedLabels = labelsInput
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean);

      await taskService.createTask({
        projectId,
        boardColumnId: data.boardColumnId,
        title: data.title,
        description: data.description || undefined,
        priority: data.priority as PriorityLevel,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : undefined,
        startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
        assigneeIds: selectedAssigneeIds.length > 0 ? selectedAssigneeIds : undefined,
        labels: parsedLabels.length > 0 ? parsedLabels : undefined,
      });

      toast.success('Task created successfully!');
      reset();
      setSelectedAssigneeIds([]);
      setLabelsInput('');
      onClose();
      onCreated?.();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to create task';
      toast.error(msg);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Task"
      description="Add a deliverable to your project board."
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Task Title"
          placeholder="e.g. Design user profile settings view"
          error={errors.title?.message}
          {...register('title')}
        />

        <Textarea
          label="Description (Optional)"
          placeholder="Add detailed acceptance criteria or technical notes..."
          rows={3}
          error={errors.description?.message}
          {...register('description')}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Column Stage"
            error={errors.boardColumnId?.message}
            {...register('boardColumnId')}
            options={columns.map((col) => ({
              value: col.id,
              label: col.name,
            }))}
          />

          <Select
            label="Priority"
            error={errors.priority?.message}
            {...register('priority')}
            options={[
              { value: 'LOW', label: 'Low' },
              { value: 'MEDIUM', label: 'Medium' },
              { value: 'HIGH', label: 'High' },
              { value: 'URGENT', label: 'Urgent' },
            ]}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Start Date"
            type="date"
            error={errors.startDate?.message}
            {...register('startDate')}
          />

          <Input
            label="Due Date"
            type="date"
            error={errors.dueDate?.message}
            {...register('dueDate')}
          />
        </div>

        {/* Assignees */}
        {projectMembers.length > 0 && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Assign Teammates
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
              {projectMembers.map((pm) => {
                const isSelected = selectedAssigneeIds.includes(pm.userId);
                return (
                  <button
                    key={pm.userId}
                    type="button"
                    onClick={() => toggleAssignee(pm.userId)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                      isSelected
                        ? 'bg-primary-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>{pm.user?.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <Input
          label="Labels / Tags"
          placeholder="frontend, bug, high-priority (comma-separated)"
          value={labelsInput}
          onChange={(e) => setLabelsInput(e.target.value)}
        />

        <div className="flex justify-end gap-2 pt-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Create Task
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateTaskModal;
