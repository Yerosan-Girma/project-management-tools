import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { projectService } from '../services/project.service';
import { useWorkspaceStore } from '../../../stores/workspace-store';
import { PriorityLevel } from '../../../types/project.types';

const createProjectSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60, 'Name cannot exceed 60 characters'),
  key: z
    .string()
    .trim()
    .min(2, 'Key must be at least 2 characters')
    .max(10, 'Key cannot exceed 10 characters')
    .regex(/^[A-Z0-9]+$/, 'Key must be uppercase alphanumeric (e.g. TFL, PROJ)'),
  description: z.string().trim().max(300, 'Description cannot exceed 300 characters').optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const).default('MEDIUM'),
  targetDate: z.string().optional(),
});

type CreateProjectFormData = z.infer<typeof createProjectSchema>;

export interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { currentWorkspace, workspaces } = useWorkspaceStore();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateProjectFormData>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      key: '',
      description: '',
      priority: 'MEDIUM',
    },
  });

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue('name', val, { shouldValidate: true });
    // Auto-generate key candidate if key is empty or untouched
    const candidate = val
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(0, 4)
      .toUpperCase();
    if (candidate.length >= 2) {
      setValue('key', candidate, { shouldValidate: true });
    }
  };

  const onSubmit = async (data: CreateProjectFormData) => {
    if (!currentWorkspace) {
      toast.error('Please select or create a workspace first');
      return;
    }

    try {
      await projectService.createProject({
        workspaceId: currentWorkspace.id,
        name: data.name,
        key: data.key,
        description: data.description || undefined,
        priority: data.priority as PriorityLevel,
        targetDate: data.targetDate ? new Date(data.targetDate).toISOString() : undefined,
      });

      toast.success(`Project "${data.name}" created with default Kanban board!`);
      reset();
      onClose();
      onCreated?.();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to create project';
      toast.error(msg);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Project"
      description="Create a project to track tasks, sprints, and team milestones."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {workspaces.length > 1 && (
          <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 p-2.5 text-xs text-slate-500 border border-slate-200 dark:border-slate-700">
            Creating in workspace: <span className="font-bold text-slate-800 dark:text-slate-200">{currentWorkspace?.name}</span>
          </div>
        )}

        <Input
          label="Project Name"
          placeholder="e.g. Website Redesign 2026"
          error={errors.name?.message}
          {...register('name', { onChange: handleNameChange })}
        />

        <Input
          label="Project Key (Identifier)"
          placeholder="e.g. WEB, TFL, CORE"
          error={errors.key?.message}
          helperText="Unique uppercase prefix for task IDs (e.g. WEB-101)."
          {...register('key')}
        />

        <Textarea
          label="Description (Optional)"
          placeholder="What are the goals of this project?"
          rows={3}
          error={errors.description?.message}
          {...register('description')}
        />

        <div className="grid grid-cols-2 gap-4">
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

          <Input
            label="Target Completion Date"
            type="date"
            error={errors.targetDate?.message}
            {...register('targetDate')}
          />
        </div>

        <div className="flex justify-end gap-2 pt-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Create Project
          </Button>
        </div>
      </form>
    </Modal>
  );
};
