import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Copy, CheckCircle2 } from 'lucide-react';
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
  const [inviteResult, setInviteResult] = useState<{
    email: string;
    inviteUrl: string | null;
    emailSent?: boolean;
  } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '', role: 'MEMBER' },
  });

  const handleClose = () => {
    setInviteResult(null);
    reset();
    onClose();
  };

  const onSubmit = async (data: InviteFormData) => {
    try {
      const created = await workspaceService.inviteMember(workspaceId, data.email, data.role as WorkspaceRole);
      const inviteUrl = created?.token ? `${window.location.origin}/invitations/${created.token}` : null;
      const emailSent = (created as any)?.emailSent !== false;

      setInviteResult({
        email: data.email,
        inviteUrl,
        emailSent,
      });

      if (emailSent) {
        toast.success(`Invitation dispatched to ${data.email}`, {
          description: 'Email sent! (Check Inbox or Spam folder).',
        });
      } else {
        toast.warning(`Invitation registered for ${data.email}`, {
          description: 'Copy the direct link below to share with your teammate.',
        });
      }

      onInvited?.();
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'Failed to send invitation');
      toast.error(msg);
    }
  };

  const handleCopyLink = () => {
    if (inviteResult?.inviteUrl) {
      navigator.clipboard.writeText(inviteResult.inviteUrl);
      toast.success('Invitation link copied to clipboard!');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={inviteResult ? 'Invitation Dispatched' : 'Invite Team Member'}
      description={
        inviteResult
          ? 'Collaborator invitation details and direct link.'
          : 'Send an email invitation with workspace access rights.'
      }
    >
      {inviteResult ? (
        <div className="space-y-4 pt-1">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
              <p className="font-semibold text-sm">Invitation created for {inviteResult.email}</p>
              <p className="text-emerald-700 dark:text-emerald-300">
                {inviteResult.emailSent
                  ? 'Email invitation dispatched! If the recipient does not see it right away, remind them to check their Spam or Promotions tab.'
                  : 'Invitation record created. You can share the direct invite link below.'}
              </p>
            </div>
          </div>

          {inviteResult.inviteUrl && (
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Direct Invitation Link (Valid for 7 days)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={inviteResult.inviteUrl}
                  className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono select-all"
                />
                <Button type="button" size="sm" variant="outline" onClick={handleCopyLink} leftIcon={<Copy className="w-3.5 h-3.5" />}>
                  Copy
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setInviteResult(null);
                reset();
              }}
            >
              Invite Another
            </Button>
            <Button type="button" onClick={handleClose}>
              Done
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-1">
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

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-[11px] text-slate-500 leading-relaxed">
            ✉️ An email will be dispatched to this address containing a single-use 7-day link.
          </div>

          <div className="flex justify-end gap-2 pt-3">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              Send Invitation
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
