import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Button } from '../../../components/ui/Button';
import { workspaceService } from '../services/workspace.service';
import { useWorkspaceStore } from '../../../stores/workspace-store';

const createWorkspaceSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(50, 'Name cannot exceed 50 characters'),
  description: z.string().trim().max(250, 'Description cannot exceed 250 characters').optional(),
});

type CreateWorkspaceFormData = z.infer<typeof createWorkspaceSchema>;

export interface CreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export const CreateWorkspaceModal: React.FC<CreateWorkspaceModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const addWorkspace = useWorkspaceStore((s) => s.addWorkspace);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateWorkspaceFormData>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: { name: '', description: '' },
  });

  const onSubmit = async (data: CreateWorkspaceFormData) => {
    try {
      const newWs = await workspaceService.createWorkspace({
        name: data.name,
        description: data.description || undefined,
      });
      addWorkspace(newWs);
      toast.success(`Workspace "${newWs.name}" created!`);
      reset();
      onClose();
      onCreated?.();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to create workspace';
      toast.error(msg);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Workspace"
      description="Workspaces are isolated containers for projects, teams, and deliverables."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Workspace Name"
          placeholder="e.g. Acme Engineering or Product Studio"
          error={errors.name?.message}
          {...register('name')}
        />

        <Textarea
          label="Description (Optional)"
          placeholder="What is this workspace focused on?"
          rows={3}
          error={errors.description?.message}
          {...register('description')}
        />

        <div className="flex justify-end gap-2 pt-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Create Workspace
          </Button>
        </div>
      </form>
    </Modal>
  );
};
