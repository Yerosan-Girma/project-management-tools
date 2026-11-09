import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { workspaceService } from '../services/workspace.service';
import { WorkspaceRole } from '../../../types/workspace.types';
import { getErrorMessage } from '../../../utils/error';

const inviteSchema = z.object({
  email: z.string().trim().email('Please enter a valid email address'),
  role: z.enum(['ADMIN', 'MEMBER', 'GUEST'] as const),
});

type InviteFormData = z.infer<typeof inviteSchema>;

export interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: string;
  onInvited?: () => void;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  workspaceId,
  onInvited,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '', role: 'MEMBER' },
  });

  const onSubmit = async (data: InviteFormData) => {
    try {
      const created = await workspaceService.inviteMember(workspaceId, data.email, data.role as WorkspaceRole);
      const inviteUrl = created?.token ? `${window.location.origin}/invitations/${created.token}` : null;
      
      toast.success(`Invitation sent to ${data.email}`, {
        description: 'Invitation email dispatched! (Check Spam or Promotions if not in Inbox, or copy the direct link).',
        action: inviteUrl ? {
          label: 'Copy Link',
          onClick: () => {
            navigator.clipboard.writeText(inviteUrl);
            toast.success('Invitation link copied to clipboard!');
          },
        } : undefined,
      });

      reset();
      onClose();
      onInvited?.();
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'Failed to send invitation');
      toast.error(msg);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Invite Team Member"
      description="Send an email invitation with workspace access rights."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email Address"
          placeholder="colleague@company.com"
          startIcon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <Select
          label="Workspace Role"
          error={errors.role?.message}
          {...register('role')}
          options={[
            { value: 'MEMBER', label: 'Member — Can create and collaborate on projects and tasks' },
            { value: 'ADMIN', label: 'Admin — Can manage members and workspace configurations' },
            { value: 'GUEST', label: 'Guest — Read-only access to assigned projects' },
          ]}
        />

        <div className="flex justify-end gap-2 pt-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Send Invitation
          </Button>
        </div>
      </form>
    </Modal>
  );
};
