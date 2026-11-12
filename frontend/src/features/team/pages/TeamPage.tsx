import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  Trash2,
  Search,
  Clock,
  Crown,
  FolderGit2,
  Loader2,
  Copy,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../../../stores/auth-store';
import { useWorkspaceStore } from '../../../stores/workspace-store';
import { workspaceService } from '../../workspaces/services/workspace.service';
import { projectService } from '../../projects/services/project.service';
import { WorkspaceMember, WorkspaceInvitation, WorkspaceRole } from '../../../types/workspace.types';
import { Project } from '../../../types/project.types';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Avatar } from '../../../components/ui/Avatar';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Modal } from '../../../components/ui/Modal';
import { InviteMemberModal } from '../../workspaces/components/InviteMemberModal';

export const TeamPage: React.FC = () => {
  const { user } = useAuthStore();
  const { currentWorkspace } = useWorkspaceStore();

  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [invitations, setInvitations] = useState<WorkspaceInvitation[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Tabs & Filters
  const [activeTab, setActiveTab] = useState<'members' | 'invitations' | 'roles'>('members');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');

  // Modals
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [removeMemberTarget, setRemoveMemberTarget] = useState<WorkspaceMember | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  // Check if current user is owner or admin in this workspace
  const isOwnerOrAdmin = useMemo(() => {
    if (user?.platformRole === 'PLATFORM_ADMIN') return true;
    if (currentWorkspace?.ownerId === user?.id) return true;
    const currentMember = members.find((m) => m.userId === user?.id);
    return currentMember?.role === 'ADMIN' || currentMember?.role === 'OWNER';
  }, [user, currentWorkspace, members]);

  // Load team data
  const loadTeamData = useCallback(async () => {
    if (!currentWorkspace?.id) {
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const [membersData, invitesData, projData] = await Promise.all([
        workspaceService.getMembers(currentWorkspace.id),
        workspaceService.getInvitations(currentWorkspace.id).catch(() => []),
        projectService.getWorkspaceProjects(currentWorkspace.id).catch(() => []),
      ]);

      const parsedMembers = membersData.items || (Array.isArray(membersData) ? membersData : []);
      setMembers(parsedMembers);
      setInvitations(Array.isArray(invitesData) ? invitesData : []);
      setProjects(projData);
    } catch {
      toast.error('Failed to load workspace team members');
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace?.id]);

  useEffect(() => {
    loadTeamData();
  }, [loadTeamData]);

  // Count projects a user is enrolled in
  const getUserProjectCount = useCallback(
    (userId: string) => {
      return projects.filter((p) => p.members?.some((m) => m.userId === userId)).length;
    },
    [projects]
  );

  // Handle role change
  const handleRoleChange = async (targetUserId: string, newRole: WorkspaceRole) => {
    if (!currentWorkspace?.id) return;
    try {
      await workspaceService.updateMemberRole(currentWorkspace.id, targetUserId, newRole);
      toast.success('Member role updated successfully');
      setMembers((prev) =>
        prev.map((m) => (m.userId === targetUserId ? { ...m, role: newRole } : m))
      );
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to update member role';
      toast.error(msg);
    }
  };

  // Handle remove member confirmation
  const handleConfirmRemoveMember = async () => {
    if (!currentWorkspace?.id || !removeMemberTarget) return;
    try {
      setIsRemoving(true);
      await workspaceService.removeMember(currentWorkspace.id, removeMemberTarget.userId);
      toast.success(`Removed ${removeMemberTarget.user.name} from workspace`);
      setMembers((prev) => prev.filter((m) => m.userId !== removeMemberTarget.userId));
      setRemoveMemberTarget(null);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to remove member';
      toast.error(msg);
    } finally {
      setIsRemoving(false);
    }
  };

  // Handle cancel invitation
  const handleCancelInvite = async (invitationId: string) => {
    if (!currentWorkspace?.id) return;
    try {
      await workspaceService.cancelInvitation(currentWorkspace.id, invitationId);
      toast.success('Invitation revoked');
      setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
    } catch {
      toast.error('Failed to cancel invitation');
    }
  };

  const [resendingInviteId, setResendingInviteId] = useState<string | null>(null);

  // Handle resend invitation email
  const handleResendInvite = async (invitationId: string, email: string) => {
    if (!currentWorkspace?.id) return;
    try {
      setResendingInviteId(invitationId);
      const updated = await workspaceService.resendInvitation(currentWorkspace.id, invitationId);
      if (updated.emailSent) {
        toast.success(`Invitation email resent to ${email}!`, {
          description: 'A refreshed 7-day invitation link has been dispatched to their inbox.',
        });
      } else {
        toast.warning(`Invitation link refreshed for ${email}`, {
          description: 'The email could not be sent. Copy and share the refreshed invitation link.',
        });
      }
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

  // Filtered members
  const filteredMembers = useMemo(() => {
    return members.filter((member) => {
      if (roleFilter !== 'ALL' && member.role !== roleFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        member.user.name.toLowerCase().includes(q) ||
        member.user.email.toLowerCase().includes(q)
      );
    });
  }, [members, roleFilter, searchQuery]);

  if (!currentWorkspace) {
    return (
      <EmptyState
        icon={<Users className="w-8 h-8 text-primary-500" />}
        title="No active workspace selected"
        description="Please select or create a workspace from the top-left switcher to view and manage team members."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Team & Permissions
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              {currentWorkspace?.name}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage workspace members, assign role permissions, and track project collaboration.
          </p>
        </div>

        {isOwnerOrAdmin && (
          <Button
            variant="primary"
            size="sm"
            leftIcon={<UserPlus className="w-4 h-4" />}
            onClick={() => setIsInviteOpen(true)}
            className="shadow-sm font-semibold self-start sm:self-auto"
          >
            Invite Member
          </Button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('members')}
          className={`pb-3 px-1 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'members'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Active Members ({members.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('invitations')}
          className={`pb-3 px-1 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'invitations'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Pending Invitations ({invitations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className={`pb-3 px-1 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'roles'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Roles & Permissions Guide</span>
        </button>
      </div>

      {/* TAB 1: MEMBERS */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="w-full sm:w-72">
              <Input
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                startIcon={<Search className="w-4 h-4 text-slate-400" />}
                className="text-xs"
              />
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <span className="text-xs text-slate-500">Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-primary-500"
              >
                <option value="ALL">All Roles</option>
                <option value="OWNER">Owner</option>
                <option value="ADMIN">Admin</option>
                <option value="MEMBER">Member</option>
                <option value="GUEST">Guest</option>
              </select>
            </div>
          </div>

          {/* Members Table */}
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-7 h-7 animate-spin text-primary-600 mb-2" />
              <span className="text-xs">Loading team directory...</span>
            </div>
          ) : filteredMembers.length === 0 ? (
            <EmptyState
              icon={<Users className="w-6 h-6" />}
              title="No members found"
              description={
                searchQuery
                  ? 'No teammate matches your search filter.'
                  : 'Start by inviting teammates to this workspace.'
              }
            />
          ) : (
            <div className="rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/70 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3.5 px-4 sm:px-6">Member</th>
                      <th className="py-3.5 px-4">Workspace Role</th>
                      <th className="py-3.5 px-4 hidden md:table-cell">Projects</th>
                      <th className="py-3.5 px-4 hidden lg:table-cell">Joined</th>
                      {isOwnerOrAdmin && <th className="py-3.5 px-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                    {filteredMembers.map((member) => {
                      const isOwner = member.role === 'OWNER';
                      const isCurrentUser = member.userId === user?.id;
                      const projectCount = getUserProjectCount(member.userId);

                      return (
                        <tr
                          key={member.id}
                          className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          {/* Member info */}
                          <td className="py-3.5 px-4 sm:px-6">
                            <div className="flex items-center gap-3">
                              <Avatar
                                src={member.user.avatarUrl}
                                name={member.user.name}
                                size="sm"
                              />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-semibold text-slate-900 dark:text-white truncate">
                                    {member.user.name}
                                  </p>
                                  {isCurrentUser && (
                                    <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                                      You
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-400 truncate">
                                  {member.user.email}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Role Badge / Role Selector */}
                          <td className="py-3.5 px-4">
                            {isOwnerOrAdmin && !isOwner && !isCurrentUser ? (
                              <select
                                value={member.role}
                                onChange={(e) =>
                                  handleRoleChange(member.userId, e.target.value as WorkspaceRole)
                                }
                                className="text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-slate-800 dark:text-slate-200"
                              >
                                <option value="ADMIN">Admin</option>
                                <option value="MEMBER">Member</option>
                                <option value="GUEST">Guest</option>
                              </select>
                            ) : (
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full font-semibold text-[11px] ${
                                  member.role === 'OWNER'
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-900'
                                    : member.role === 'ADMIN'
                                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/60 dark:text-indigo-300 dark:border-indigo-900'
                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                                }`}
                              >
                                {member.role === 'OWNER' && <Crown className="w-3 h-3 text-amber-500" />}
                                {member.role === 'ADMIN' && <Shield className="w-3 h-3 text-indigo-500" />}
                                <span>{member.role}</span>
                              </span>
                            )}
                          </td>

                          {/* Projects enrolled */}
                          <td className="py-3.5 px-4 hidden md:table-cell text-slate-500">
                            <span className="flex items-center gap-1 text-[11px]">
                              <FolderGit2 className="w-3.5 h-3.5 text-slate-400" />
                              <span>{projectCount} project{projectCount === 1 ? '' : 's'}</span>
                            </span>
                          </td>

                          {/* Joined date */}
                          <td className="py-3.5 px-4 hidden lg:table-cell text-slate-400 text-[11px]">
                            {new Date(member.joinedAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>

                          {/* Actions */}
                          {isOwnerOrAdmin && (
                            <td className="py-3.5 px-4 text-right">
                              {!isOwner && !isCurrentUser && (
                                <button
                                  type="button"
                                  onClick={() => setRemoveMemberTarget(member)}
                                  title="Remove member"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INVITATIONS */}
      {activeTab === 'invitations' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Invitations awaiting acceptance by teammates.
            </p>
            {isOwnerOrAdmin && (
              <Button
                variant="outline"
                size="sm"
                leftIcon={<UserPlus className="w-3.5 h-3.5" />}
                onClick={() => setIsInviteOpen(true)}
              >
                New Invitation
              </Button>
            )}
          </div>

          {invitations.length === 0 ? (
            <EmptyState
              icon={<Mail className="w-6 h-6" />}
              title="No pending invitations"
              description="All invited teammates have accepted or no invitations are currently active."
            />
          ) : (
            <div className="rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-xs divide-y divide-slate-100 dark:divide-slate-800">
              {invitations.map((inv) => (
                <div key={inv.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950 dark:text-primary-400 flex items-center justify-center font-bold">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">
                        {inv.email}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span>Role: <strong className="text-slate-600 dark:text-slate-300">{inv.role}</strong></span>
                        <span>•</span>
                        <span>Expires {new Date(inv.expiresAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResendInvite(inv.id, inv.email)}
                      isLoading={resendingInviteId === inv.id}
                      className="text-xs gap-1.5 text-primary-600 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-950"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Resend Email
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const url = `${window.location.origin}/invitations/${inv.token}`;
                        navigator.clipboard.writeText(url);
                        toast.success(`Invitation link for ${inv.email} copied to clipboard!`);
                      }}
                      className="text-xs gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy Link
                    </Button>
                    {isOwnerOrAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelInvite(inv.id)}
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950 text-xs"
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ROLES & PERMISSIONS */}
      {activeTab === 'roles' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Role-Based Access Governance
            </h3>
            <p className="text-xs text-slate-500">
              TeamFlow enforces strict multi-tenant boundaries and role authorizations across every operation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-amber-200/70 bg-amber-50/40 dark:border-amber-900/60 dark:bg-amber-950/20 space-y-2">
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-600" />
                <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">Owner</h4>
              </div>
              <p className="text-[11px] text-amber-800 dark:text-amber-300">
                Full governance over workspace billing, name, ownership transfer, member removal, and workspace deletion.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-indigo-200/70 bg-indigo-50/40 dark:border-indigo-900/60 dark:bg-indigo-950/20 space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-600" />
                <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200">Admin</h4>
              </div>
              <p className="text-[11px] text-indigo-800 dark:text-indigo-300">
                Can create and manage all workspace projects, invite new members, change roles (Member/Guest), and delete projects.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900 space-y-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary-600" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Member</h4>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Can create and update assigned tasks, participate in discussions, move Kanban cards, and view enrolled projects.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900 space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">Guest / Viewer</h4>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Read-only observer permissions. Can inspect boards and deliverables without editing permissions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Invite Member Modal */}
      {currentWorkspace && (
        <InviteMemberModal
          isOpen={isInviteOpen}
          onClose={() => setIsInviteOpen(false)}
          workspaceId={currentWorkspace.id}
          onInvited={loadTeamData}
        />
      )}

      {/* Remove Member Confirmation Modal */}
      <Modal
        isOpen={Boolean(removeMemberTarget)}
        onClose={() => setRemoveMemberTarget(null)}
        title="Remove Member from Workspace"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Are you sure you want to remove{' '}
            <strong className="text-slate-900 dark:text-white">
              {removeMemberTarget?.user.name}
            </strong>{' '}
            ({removeMemberTarget?.user.email}) from{' '}
            <strong>{currentWorkspace?.name}</strong>? They will lose access to all projects and tasks in this workspace.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRemoveMemberTarget(null)}
              disabled={isRemoving}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isRemoving}
              onClick={handleConfirmRemoveMember}
            >
              Remove Member
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TeamPage;
