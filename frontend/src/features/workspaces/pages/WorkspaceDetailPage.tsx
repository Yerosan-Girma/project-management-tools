import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Users,
  Settings,
  Mail,
  UserPlus,
  Trash2,
  Shield,
  Loader2,
  Crown,
  Send,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../../../stores/auth-store';
import { useWorkspaceStore } from '../../../stores/workspace-store';
import { workspaceService } from '../services/workspace.service';
import {
  Workspace,
  WorkspaceMember,
  WorkspaceInvitation,
  WorkspaceRole,
} from '../../../types/workspace.types';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Badge } from '../../../components/ui/Badge';
import { Avatar } from '../../../components/ui/Avatar';
import { Modal } from '../../../components/ui/Modal';
import { InviteMemberModal } from '../components/InviteMemberModal';

export const WorkspaceDetailPage: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { user } = useAuthStore();
  const { updateWorkspaceInStore } = useWorkspaceStore();
  const navigate = useNavigate();

  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'members' | 'invitations' | 'settings'>('members');

  // Modals state
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [transferUserId, setTransferUserId] = useState<string | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Settings form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const loadData = useCallback(async () => {
    if (!workspaceId) return;
    try {
      setIsLoading(true);
      const [wsData, membersData, invitesData] = await Promise.all([
        workspaceService.getWorkspace(workspaceId),
        workspaceService.getMembers(workspaceId),
        workspaceService.getInvitations(workspaceId),
      ]);
      setWorkspace(wsData);
      setName(wsData.name);
      setDescription(wsData.description || '');
      setMembers(membersData.items || []);
      setInvitations(invitesData || []);
    } catch {
      toast.error('Failed to load workspace details');
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading || !workspace) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-2" />
        <span className="text-xs">Loading workspace details...</span>
      </div>
    );
  }

  const myMember = members.find((m) => m.userId === user?.id);
  const isOwner = workspace.ownerId === user?.id || user?.platformRole === 'PLATFORM_ADMIN';
  const canManage = isOwner || myMember?.role === 'ADMIN';
  const isViewer = myMember?.role === 'GUEST';

  const handleUpdateRole = async (memberUserId: string, newRole: WorkspaceRole) => {
    try {
      await workspaceService.updateMemberRole(workspace.id, memberUserId, newRole);
      setMembers((prev) =>
        prev.map((m) => (m.userId === memberUserId ? { ...m, role: newRole } : m))
      );
      toast.success('Member role updated');
    } catch {
      toast.error('Failed to update role');
    }
  };

  const handleRemoveMember = async (memberUserId: string) => {
    if (!confirm('Are you sure you want to remove this member from the workspace?')) return;
    try {
      await workspaceService.removeMember(workspace.id, memberUserId);
      setMembers((prev) => prev.filter((m) => m.userId !== memberUserId));
      toast.success('Member removed');
    } catch {
      toast.error('Failed to remove member');
    }
  };

  const handleCancelInvite = async (invitationId: string) => {
    try {
      await workspaceService.cancelInvitation(workspace.id, invitationId);
      setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
      toast.success('Invitation cancelled');
    } catch {
      toast.error('Failed to cancel invitation');
    }
  };

  const [resendingInviteId, setResendingInviteId] = useState<string | null>(null);

  const handleResendInvite = async (invitationId: string, email: string) => {
    try {
      setResendingInviteId(invitationId);
      const updated = await workspaceService.resendInvitation(workspace.id, invitationId);
      toast.success(`Invitation email resent to ${email}!`, {
        description: 'A refreshed 7-day invitation link has been dispatched to their inbox.',
      });
      setInvitations((prev) =>
        prev.map((i) => (i.id === invitationId ? updated : i))
      );
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to resend invitation email';
      toast.error(msg);
    } finally {
      setResendingInviteId(null);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingSettings(true);
      const updated = await workspaceService.updateWorkspace(workspace.id, {
        name,
        description: description || undefined,
      });
      setWorkspace(updated);
      updateWorkspaceInStore(updated);
      toast.success('Workspace settings updated');
    } catch {
      toast.error('Failed to update workspace');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleTransferOwnership = async () => {
    if (!transferUserId) return;
    try {
      const updated = await workspaceService.transferOwnership(workspace.id, transferUserId);
      setWorkspace(updated);
      setIsTransferModalOpen(false);
      setTransferUserId(null);
      toast.success('Ownership transferred successfully');
      loadData();
    } catch {
      toast.error('Failed to transfer ownership');
    }
  };

  const handleDeleteWorkspace = async () => {
    if (deleteConfirmText !== workspace.name) {
      toast.error('Confirmation name does not match');
      return;
    }
    try {
      await workspaceService.deleteWorkspace(workspace.id);
      toast.success('Workspace deleted');
      navigate('/workspaces');
    } catch {
      toast.error('Failed to delete workspace');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary-600 text-white font-bold flex items-center justify-center text-base shadow-sm">
            {workspace.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {workspace.name}
              {isOwner && (
                <Badge variant="outline" size="sm">
                  <Shield className="w-3 h-3 mr-1 text-primary-500" />
                  Owner
                </Badge>
              )}
            </h1>
            <p className="text-xs text-slate-500">/{workspace.slug} • Created {new Date(workspace.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {canManage && (
          <Button size="sm" onClick={() => setIsInviteOpen(true)} leftIcon={<UserPlus className="w-4 h-4" />}>
            Invite Member
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('members')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'members'
              ? 'bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          Members ({members.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('invitations')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'invitations'
              ? 'bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <Mail className="w-4 h-4" />
          Pending Invitations ({invitations.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'settings'
              ? 'bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>

      {/* Members Tab */}
      {activeTab === 'members' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Workspace Members</h3>
              <p className="text-xs text-slate-500 mt-0.5">{members.length} Total Users</p>
            </div>
            {canManage && (
              <Button size="sm" onClick={() => setIsInviteOpen(true)} leftIcon={<UserPlus className="w-4 h-4" />}>
                Invite Member
              </Button>
            )}
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 p-2 sm:p-4">
            {members.map((member) => {
              const isMemberOwner = member.userId === workspace.ownerId;
              const isSelf = member.userId === user?.id;

              return (
                <div key={member.id} className="py-3 px-2 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar src={member.user?.avatarUrl} name={member.user?.name} size="md" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                        {member.user?.name}
                        {isSelf && <span className="text-xs text-primary-600 font-normal">(You)</span>}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{member.user?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {isMemberOwner ? (
                      <Badge variant="primary" size="md">
                        <Crown className="w-3.5 h-3.5 mr-1" />
                        Owner
                      </Badge>
                    ) : canManage && !isSelf ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={member.role}
                          onChange={(e) => handleUpdateRole(member.userId, e.target.value as WorkspaceRole)}
                          className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 focus:ring-1 focus:ring-primary-500"
                        >
                          <option value="ADMIN">Admin</option>
                          <option value="MEMBER">Member</option>
                          <option value="GUEST">Guest</option>
                        </select>

                        {isOwner && (
                          <button
                            type="button"
                            onClick={() => {
                              setTransferUserId(member.userId);
                              setIsTransferModalOpen(true);
                            }}
                            className="text-xs text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Transfer ownership to this user"
                          >
                            <Crown className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleRemoveMember(member.userId)}
                          className="text-xs text-rose-500 hover:text-rose-700 p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Remove user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <Badge variant="outline" size="md">
                        {member.role}
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Invitations Tab */}
      {activeTab === 'invitations' && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Pending Invitations</h3>
              <p className="text-xs text-slate-500 mt-0.5">Invited users awaiting acceptance</p>
            </div>
            {canManage && (
              <Button size="sm" onClick={() => setIsInviteOpen(true)} leftIcon={<UserPlus className="w-4 h-4" />}>
                Invite New
              </Button>
            )}
          </div>
          <div className="p-2 sm:p-4">
            {invitations.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                No pending invitations for this workspace.
              </p>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {invitations.map((inv) => (
                  <div key={inv.id} className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                        {inv.email}
                      </p>
                      <p className="text-xs text-slate-500">
                        Role: {inv.role} • Expires {new Date(inv.expiresAt).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResendInvite(inv.id, inv.email)}
                        isLoading={resendingInviteId === inv.id}
                        className="text-xs text-primary-600 gap-1"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Resend
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const inviteUrl = `${window.location.origin}/invitations/${inv.token}`;
                          navigator.clipboard.writeText(inviteUrl);
                          toast.success('Invitation link copied to clipboard!');
                        }}
                        className="text-xs gap-1"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Copy Link
                      </Button>

                      {canManage && (
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleCancelInvite(inv.id)}
                          className="text-xs"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {!canManage && (
            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300">
              ℹ️ <strong>Read-Only Mode:</strong> You are viewing workspace settings as a {isViewer ? 'guest viewer' : 'member'}. Only workspace administrators or the workspace owner can modify configurations or delete this workspace.
            </div>
          )}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-xs">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Workspace General Settings</h3>
              <p className="text-xs text-slate-500 mt-0.5">Basic information and details for this workspace.</p>
            </div>
            <div className="p-4 sm:p-6">
              <form onSubmit={handleSaveSettings} className="space-y-4 max-w-lg">
                <Input
                  label="Workspace Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!canManage}
                />

                <Textarea
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={!canManage}
                  rows={3}
                />

                {canManage && (
                  <Button type="submit" isLoading={isSavingSettings}>
                    Save Settings
                  </Button>
                )}
              </form>
            </div>
          </div>

          {/* Danger Zone */}
          {isOwner && (
            <Card className="border-rose-200 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/20">
              <CardHeader>
                <CardTitle className="text-rose-600 dark:text-rose-400">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                      Delete Workspace
                    </h4>
                    <p className="text-xs text-slate-500">
                      Permanently delete this workspace and all associated projects and tasks.
                    </p>
                  </div>
                  <Button variant="danger" size="sm" onClick={() => setIsDeleteModalOpen(true)} className="self-start sm:self-auto">
                    Delete Workspace
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Invite Modal */}
      <InviteMemberModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        workspaceId={workspace.id}
        onInvited={loadData}
      />

      {/* Transfer Ownership Modal */}
      <Modal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        title="Transfer Workspace Ownership"
        description="Transfer full control of this workspace to another team member. This action cannot be undone."
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-slate-600 dark:text-slate-400">
            You will become a regular Admin and the selected member will assume Owner privileges.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsTransferModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleTransferOwnership}>
              Confirm Transfer
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Workspace Deletion"
        description={`To delete, type "${workspace.name}" below:`}
      >
        <div className="space-y-4 pt-2">
          <Input
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder={workspace.name}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={deleteConfirmText !== workspace.name}
              onClick={handleDeleteWorkspace}
            >
              Permanently Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WorkspaceDetailPage;
