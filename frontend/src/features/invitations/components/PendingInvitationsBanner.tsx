import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  CheckCircle2,
  XCircle,
  FolderGit2,
  Building2,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { workspaceService } from '../../workspaces/services/workspace.service';
import { WorkspaceInvitation } from '../../../types/workspace.types';
import { useWorkspaceStore } from '../../../stores/workspace-store';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';

interface PendingInvitationsBannerProps {
  onProcessed?: () => void;
  className?: string;
}

const getErrorText = (err: unknown, fallback: string): string => {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as any).response;
    if (res?.data?.message) return res.data.message;
  }
  if (err instanceof Error) return err.message;
  return fallback;
};

export const PendingInvitationsBanner: React.FC<PendingInvitationsBannerProps> = ({
  onProcessed,
  className = '',
}) => {
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [processingToken, setProcessingToken] = useState<string | null>(null);
  const { setWorkspaces, setCurrentWorkspace } = useWorkspaceStore();
  const navigate = useNavigate();

  const loadPendingInvitations = useCallback(async () => {
    try {
      const list = await workspaceService.getMyPendingInvitations();
      setInvitations(list || []);
    } catch {
      // Handled silently
    }
  }, []);

  useEffect(() => {
    loadPendingInvitations();
  }, [loadPendingInvitations]);

  const handleAccept = async (invitation: WorkspaceInvitation) => {
    try {
      setProcessingToken(invitation.token);
      const result = await workspaceService.acceptInvitation(invitation.token);

      toast.success(
        invitation.project
          ? `Welcome to ${invitation.project.name}!`
          : `Joined ${invitation.workspace?.name || 'Workspace'}!`,
        {
          description: `Your access permissions have been granted.`,
        }
      );

      // Refresh workspaces in store
      const updatedWorkspaces = await workspaceService.getWorkspaces().catch(() => []);
      if (updatedWorkspaces.length > 0) {
        setWorkspaces(updatedWorkspaces);
        // Switch to the target workspace if different
        const targetWs = updatedWorkspaces.find((w) => w.id === invitation.workspaceId);
        if (targetWs) {
          setCurrentWorkspace(targetWs);
        }
      }

      // Remove from list
      setInvitations((prev) => prev.filter((i) => i.id !== invitation.id));

      if (onProcessed) {
        onProcessed();
      }

      // If accepted into a project, navigate to project page
      const targetProjectId = result?.projectId || invitation.projectId;
      if (targetProjectId) {
        navigate(`/projects/${targetProjectId}`);
      }
    } catch (err: unknown) {
      toast.error(getErrorText(err, 'Failed to accept invitation'));
    } finally {
      setProcessingToken(null);
    }
  };

  const handleDecline = async (invitation: WorkspaceInvitation) => {
    if (!confirm(`Are you sure you want to decline this invitation?`)) return;
    try {
      setProcessingToken(invitation.token);
      await workspaceService.rejectInvitation(invitation.token);
      toast.info('Invitation declined');
      setInvitations((prev) => prev.filter((i) => i.id !== invitation.id));
      if (onProcessed) {
        onProcessed();
      }
    } catch (err: unknown) {
      toast.error(getErrorText(err, 'Failed to decline invitation'));
    } finally {
      setProcessingToken(null);
    }
  };

  if (invitations.length === 0) {
    return null;
  }

  return (
    <div
      className={`rounded-2xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50/90 via-sky-50/70 to-indigo-50/90 dark:from-indigo-950/40 dark:via-slate-900/40 dark:to-indigo-950/40 p-4 md:p-5 shadow-sm space-y-3.5 transition-all ${className}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
            <Mail className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Pending Invitations
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                {invitations.length} new
              </span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              You have been invited to collaborate. Accept to gain instant access to boards and tasks.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        {invitations.map((inv) => {
          const isProjectInvite = Boolean(inv.project);
          const isProcessing = processingToken === inv.token;

          return (
            <div
              key={inv.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 p-3.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`p-2 rounded-lg mt-0.5 shrink-0 ${
                    isProjectInvite
                      ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                      : 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400'
                  }`}
                >
                  {isProjectInvite ? (
                    <FolderGit2 className="w-4 h-4" />
                  ) : (
                    <Building2 className="w-4 h-4" />
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-slate-900 dark:text-white truncate">
                      {isProjectInvite ? inv.project?.name : inv.workspace?.name}
                    </span>
                    {isProjectInvite ? (
                      <Badge variant="primary" size="sm">
                        Project • {inv.projectRole || 'MEMBER'}
                      </Badge>
                    ) : (
                      <Badge variant="outline" size="sm">
                        Workspace • {inv.role}
                      </Badge>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isProjectInvite && (
                      <span className="mr-2">
                        Workspace:{' '}
                        <strong className="text-slate-700 dark:text-slate-300">
                          {inv.workspace?.name}
                        </strong>
                      </span>
                    )}
                    {inv.inviter?.email && (
                      <span>
                        Invited by{' '}
                        <span className="text-slate-700 dark:text-slate-300 font-medium">
                          {inv.inviter.name || inv.inviter.email}
                        </span>
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDecline(inv)}
                  disabled={isProcessing}
                  className="h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 border-rose-200 dark:border-rose-900/50"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" />
                  Decline
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleAccept(inv)}
                  disabled={isProcessing}
                  className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                      Accept & Join
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
