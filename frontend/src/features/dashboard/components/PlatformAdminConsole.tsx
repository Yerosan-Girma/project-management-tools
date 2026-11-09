import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ShieldCheck,
  Users,
  Building2,
  FolderGit2,
  CheckSquare,
  Search,
  UserCheck,
  UserX,
  RotateCw,
  Clock,
  Activity,
  Database,
  Radio,
  ChevronRight,
  Shield,
  Trash2,
  Eye,
  AlertTriangle,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  userService,
  PlatformStats,
  PlatformUserItem,
  UserHierarchyDetails,
} from '../../users/services/user.service';
import { workspaceService } from '../../workspaces/services/workspace.service';
import { Workspace } from '../../../types/workspace.types';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Avatar } from '../../../components/ui/Avatar';
import { Modal } from '../../../components/ui/Modal';
import { useAuthStore } from '../../../stores/auth-store';
import { useWorkspaceStore } from '../../../stores/workspace-store';

type AdminTab = 'USERS' | 'WORKSPACES' | 'AUDIT_LOGS';

export const PlatformAdminConsole: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const { setCurrentWorkspace } = useWorkspaceStore();

  const [activeTab, setActiveTab] = useState<AdminTab>('USERS');
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [users, setUsers] = useState<PlatformUserItem[]>([]);
  const [allWorkspaces, setAllWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Hierarchy inspect state
  const [isInspectModalOpen, setIsInspectModalOpen] = useState(false);
  const [inspectUser, setInspectUser] = useState<UserHierarchyDetails | null>(null);
  const [isLoadingHierarchy, setIsLoadingHierarchy] = useState(false);

  // User delete state
  const [userToDelete, setUserToDelete] = useState<PlatformUserItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // User filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'PLATFORM_ADMIN' | 'USER'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'SUSPENDED'>('ALL');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Load Platform Admin Data
  const loadPlatformData = useCallback(async (showRefreshing = false) => {
    try {
      if (showRefreshing) setIsRefreshing(true);
      else setIsLoading(true);

      const [statsData, usersData, wsData] = await Promise.all([
        userService.getPlatformStats().catch(() => null),
        userService.getPlatformUsers({ limit: 100 }).catch(() => ({ items: [], total: 0 })),
        workspaceService.getWorkspaces().catch(() => []),
      ]);

      if (statsData) setStats(statsData);
      setUsers(usersData.items || []);
      setAllWorkspaces(wsData);
    } catch (err: any) {
      toast.error('Failed to load platform administration telemetry', {
        description: err.message,
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPlatformData();
  }, [loadPlatformData]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'ALL' || u.platformRole === roleFilter;
      const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Handle Promote / Demote Role
  const handleTogglePlatformRole = async (targetUser: PlatformUserItem) => {
    const newRole = targetUser.platformRole === 'PLATFORM_ADMIN' ? 'USER' : 'PLATFORM_ADMIN';
    const actionLabel = newRole === 'PLATFORM_ADMIN' ? 'Promote to Platform Admin' : 'Demote to Standard User';

    if (targetUser.id === currentUser?.id && newRole === 'USER') {
      toast.error('Self-Demotion Blocked', {
        description: 'You cannot demote your own platform administrator privileges.',
      });
      return;
    }

    try {
      setActionInProgress(targetUser.id);
      await userService.updatePlatformRole(targetUser.id, newRole);

      // Optimistic update
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, platformRole: newRole } : u))
      );

      toast.success(`${actionLabel} Successful`, {
        description: `${targetUser.name} is now a ${newRole}.`,
      });

      // Refresh stats
      userService.getPlatformStats().then((data) => data && setStats(data));
    } catch (err: any) {
      toast.error('Failed to update platform role', {
        description: err.response?.data?.message || err.message,
      });
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle Suspend / Reactivate Status
  const handleToggleUserStatus = async (targetUser: PlatformUserItem) => {
    const newStatus = targetUser.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    const actionLabel = newStatus === 'SUSPENDED' ? 'Suspend Account' : 'Reactivate Account';

    if (targetUser.id === currentUser?.id) {
      toast.error('Self-Suspension Blocked', {
        description: 'You cannot suspend your own administrative account.',
      });
      return;
    }

    try {
      setActionInProgress(targetUser.id);
      await userService.updateUserStatus(targetUser.id, newStatus);

      // Optimistic update
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, status: newStatus } : u))
      );

      toast.success(`${actionLabel} Successful`, {
        description: `Account for ${targetUser.name} is now ${newStatus}.`,
      });

      // Refresh stats
      userService.getPlatformStats().then((data) => data && setStats(data));
    } catch (err: any) {
      toast.error('Failed to update user status', {
        description: err.response?.data?.message || err.message,
      });
    } finally {
      setActionInProgress(null);
    }
  };

  // Inspect user hierarchy (Roles, Projects, and Tasks under each Project)
  const handleInspectUser = async (u: PlatformUserItem) => {
    setIsInspectModalOpen(true);
    setIsLoadingHierarchy(true);
    setInspectUser(null);
    try {
      const details = await userService.getUserHierarchy(u.id);
      setInspectUser(details);
    } catch (err: any) {
      toast.error('Failed to load user hierarchy details', {
        description: err.response?.data?.message || err.message,
      });
      setIsInspectModalOpen(false);
    } finally {
      setIsLoadingHierarchy(false);
    }
  };

  // Delete User permanently
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    if (userToDelete.id === currentUser?.id) {
      toast.error('Self-Deletion Blocked', {
        description: 'You cannot delete your own platform administrator account.',
      });
      return;
    }

    try {
      setIsDeleting(true);
      await userService.deleteUser(userToDelete.id);
      toast.success('User Deleted Successfully', {
        description: `${userToDelete.name} (${userToDelete.email}) was removed from the platform.`,
      });
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      setUserToDelete(null);
      userService.getPlatformStats().then((data) => data && setStats(data));
    } catch (err: any) {
      toast.error('Failed to delete user', {
        description: err.response?.data?.message || err.message,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Quick switch workspace
  const handleSwitchWorkspace = (ws: Workspace) => {
    setCurrentWorkspace(ws);
    toast.success(`Switched to workspace "${ws.name}"`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-28 rounded-2xl bg-slate-200/70 dark:bg-slate-800/70 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-2xl bg-slate-200/60 dark:bg-slate-800/60 animate-pulse" />
          ))}
        </div>
        <div className="h-96 rounded-2xl bg-slate-200/50 dark:bg-slate-800/50 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. SUPERADMIN HERO BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-bold tracking-wide uppercase">
                <ShieldCheck className="w-3.5 h-3.5 text-purple-300" />
                Platform Superadmin Control Center
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-medium">
                <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
                Live Systems Online
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Global Platform Governance & Telemetry
            </h1>
            <p className="text-sm text-purple-200/90 max-w-2xl leading-relaxed">
              Complete administrative authority across all registered users, multi-tenant organizations,
              cross-workspace security boundaries, and immutable audit logs.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadPlatformData(true)}
              disabled={isRefreshing}
              className="bg-white/10 hover:bg-white/20 border-white/20 text-white gap-2"
            >
              <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Syncing...' : 'Refresh Telemetry'}</span>
            </Button>
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 2. PLATFORM KPI METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Users */}
        <Card className="border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Total Registered Users
              </span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats?.totalUsers ?? users.length}
              </span>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                {stats?.activeUsers ?? users.filter((u) => u.status === 'ACTIVE').length} active
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              {stats?.platformAdminsCount ?? 1} Superadmin{stats?.platformAdminsCount === 1 ? '' : 's'} with root privileges
            </p>
          </CardContent>
        </Card>

        {/* Metric 2: Multi-Tenant Workspaces */}
        <Card className="border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Tenant Workspaces
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats?.totalWorkspaces ?? allWorkspaces.length}
              </span>
              <span className="text-xs font-medium text-slate-500">active tenants</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Isolated multi-tenant organizational units
            </p>
          </CardContent>
        </Card>

        {/* Metric 3: Global Projects */}
        <Card className="border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Global Projects
              </span>
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <FolderGit2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats?.totalProjects ?? 0}
              </span>
              <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">tracked</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Across all organizations and boards</p>
          </CardContent>
        </Card>

        {/* Metric 4: Global Tasks */}
        <Card className="border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                System Workflow Items
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckSquare className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900 dark:text-white">
                {stats?.totalTasks ?? 0}
              </span>
              <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">tasks</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Managed via Kanban pipelines</p>
          </CardContent>
        </Card>
      </div>

      {/* 3. INTERACTIVE SUB-NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('USERS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'USERS'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Platform Users ({filteredUsers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('WORKSPACES')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'WORKSPACES'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>All Workspaces ({allWorkspaces.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('AUDIT_LOGS')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'AUDIT_LOGS'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Security Audit Telemetry</span>
        </button>
      </div>

      {/* TAB CONTENT: 1. PLATFORM USERS */}
      {activeTab === 'USERS' && (
        <Card className="border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardHeader className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-600" />
                  Platform User Directory & Role Governance
                </CardTitle>
                <p className="text-xs text-slate-500 mt-1">
                  Manage platform-wide accounts, promote users to Platform Administrators, or suspend unauthorized accounts.
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[200px]">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name or email..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 outline-none"
                >
                  <option value="ALL">All Roles</option>
                  <option value="PLATFORM_ADMIN">Platform Admin</option>
                  <option value="USER">Standard User</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 outline-none"
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 dark:bg-slate-800/50 border-b border-slate-200/60 dark:border-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Platform Role</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Workspaces</th>
                  <th className="px-4 py-3">Projects</th>
                  <th className="px-4 py-3">Tasks</th>
                  <th className="px-4 py-3">Registered</th>
                  <th className="px-4 py-3 text-right">Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-400 italic">
                      No users match the search filters.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isSelf = u.id === currentUser?.id;
                    const isSuperadmin = u.platformRole === 'PLATFORM_ADMIN';
                    const isSuspended = u.status === 'SUSPENDED';
                    const isBusy = actionInProgress === u.id;

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <Avatar src={u.avatarUrl} name={u.name} size="sm" />
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                                {u.name}
                                {isSelf && (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-normal">
                                    You
                                  </span>
                                )}
                              </p>
                              <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          {isSuperadmin ? (
                            <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-800 gap-1">
                              <ShieldCheck className="w-3 h-3 text-purple-600" />
                              PLATFORM_ADMIN
                            </Badge>
                          ) : (
                            <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200">
                              USER
                            </Badge>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          {isSuspended ? (
                            <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-200">
                              Suspended
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200">
                              Active
                            </Badge>
                          )}
                        </td>

                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-medium">
                          {u._count?.workspaceMemberships ?? 0}
                        </td>

                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-medium">
                          {u._count?.projectMemberships ?? 0}
                        </td>

                        <td className="px-4 py-3 text-slate-600 dark:text-slate-400 font-medium">
                          {u._count?.taskAssignments ?? 0}
                        </td>

                        <td className="px-4 py-3 text-slate-400 text-[11px]">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Inspect Hierarchy Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleInspectUser(u)}
                              title="Inspect user roles, projects, and tasks"
                              className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 text-[11px] py-1 px-2.5 h-auto flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Inspect</span>
                            </Button>

                            {/* Role Toggle Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isSelf || isBusy}
                              onClick={() => handleTogglePlatformRole(u)}
                              title={
                                isSelf
                                  ? 'Cannot change your own role'
                                  : isSuperadmin
                                  ? 'Demote to standard user'
                                  : 'Promote to platform admin'
                              }
                              className={
                                isSuperadmin
                                  ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-[11px] py-1 px-2.5 h-auto'
                                  : 'text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-[11px] py-1 px-2.5 h-auto'
                              }
                            >
                              {isSuperadmin ? 'Demote to User' : 'Make Admin'}
                            </Button>

                            {/* Status Toggle Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isSelf || isBusy}
                              onClick={() => handleToggleUserStatus(u)}
                              title={isSelf ? 'Cannot suspend your own account' : isSuspended ? 'Reactivate account' : 'Suspend account'}
                              className={
                                isSuspended
                                  ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-[11px] py-1 px-2.5 h-auto'
                                  : 'text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[11px] py-1 px-2.5 h-auto'
                              }
                            >
                              {isSuspended ? (
                                <span className="flex items-center gap-1">
                                  <UserCheck className="w-3 h-3" /> Reactivate
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <UserX className="w-3 h-3" /> Suspend
                                </span>
                              )}
                            </Button>

                            {/* Delete User Button */}
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isSelf || isBusy}
                              onClick={() => setUserToDelete(u)}
                              title={isSelf ? 'Cannot delete your own administrator account' : 'Delete user account permanently'}
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[11px] py-1 px-2.5 h-auto flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}

      {/* TAB CONTENT: 2. ALL WORKSPACES */}
      {activeTab === 'WORKSPACES' && (
        <Card className="border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardHeader className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-600" />
              All Tenant Workspaces Directory
            </CardTitle>
            <p className="text-xs text-slate-500 mt-1">
              As a Platform Administrator, you have system oversight to view and inspect all organizations.
            </p>
          </CardHeader>

          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allWorkspaces.map((ws) => (
                <div
                  key={ws.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-purple-300 dark:hover:border-purple-800 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        {ws.name.charAt(0).toUpperCase()}
                      </div>
                      <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-700 text-[10px]">
                        Tenant ID: {ws.id.slice(0, 8)}...
                      </Badge>
                    </div>

                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white">{ws.name}</h4>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">/{ws.slug}</p>
                    </div>

                    {ws.description && (
                      <p className="text-xs text-slate-500 line-clamp-2">{ws.description}</p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Created {new Date(ws.createdAt).toLocaleDateString()}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSwitchWorkspace(ws)}
                      className="gap-1 text-xs text-purple-600 hover:text-purple-700 py-1 px-2.5 h-auto"
                    >
                      <span>Switch to Workspace</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB CONTENT: 3. SECURITY AUDIT TELEMETRY */}
      {activeTab === 'AUDIT_LOGS' && (
        <Card className="border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <CardHeader className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-600" />
              Real-Time Security & Authorization Telemetry
            </CardTitle>
            <p className="text-xs text-slate-500 mt-1">
              Immutable audit log tracking privilege promotions, status modifications, ownership transfers, and policy changes.
            </p>
          </CardHeader>

          <CardContent className="p-4 sm:p-6 space-y-3">
            {(!stats?.recentAuditLogs || stats.recentAuditLogs.length === 0) ? (
              <p className="text-xs text-slate-400 italic text-center py-8">
                No recent security audit logs found. Security events will stream here automatically.
              </p>
            ) : (
              stats.recentAuditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <Avatar src={log.actor?.avatarUrl} name={log.actor?.name || 'System'} size="sm" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {log.actor?.name || 'System Administrator'}
                        </span>
                        <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-mono text-[10px]">
                          {log.action}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Resource: <span className="font-mono">{log.resourceType}</span> ({log.resourceId.slice(0, 8)}...)
                      </p>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5 bg-slate-100 dark:bg-slate-800/60 p-1 rounded inline-block">
                          {JSON.stringify(log.metadata)}
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-400 shrink-0 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* 4. PLATFORM STATUS FOOTER */}
      <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-emerald-600" />
          <span>Security Engine: <strong>Centralized RBAC & PBAC Enforced</strong></span>
        </div>
        <div className="flex items-center gap-4">
          <span>PostgreSQL 16 Engine Active</span>
          <span>•</span>
          <span>Argon2id Session Cipher</span>
          <span>•</span>
          <span>Socket.IO Live</span>
        </div>
      </div>

      {/* 5. USER HIERARCHY DETAILS MODAL */}
      <Modal
        isOpen={isInspectModalOpen}
        onClose={() => {
          setIsInspectModalOpen(false);
          setInspectUser(null);
        }}
        size="2xl"
        title={
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                User Hierarchy & Access Inspection
              </h3>
              <p className="text-xs text-slate-500 font-normal">
                Platform role, workspace memberships, project roles, and assigned tasks breakdown.
              </p>
            </div>
          </div>
        }
        footer={
          <div className="flex justify-end w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsInspectModalOpen(false);
                setInspectUser(null);
              }}
            >
              Close
            </Button>
          </div>
        }
      >
        {isLoadingHierarchy ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <RotateCw className="w-8 h-8 animate-spin text-purple-600" />
            <p className="text-xs text-slate-500 font-medium">Loading user hierarchy telemetry...</p>
          </div>
        ) : inspectUser ? (
          <div className="space-y-6">
            {/* Profile summary card */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar src={inspectUser.avatarUrl} name={inspectUser.name} size="lg" />
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    {inspectUser.name}
                    {inspectUser.emailVerifiedAt && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-normal">
                        Verified
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">{inspectUser.email}</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Registered on {new Date(inspectUser.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {inspectUser.platformRole === 'PLATFORM_ADMIN' ? (
                  <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200">
                    <ShieldCheck className="w-3 h-3 mr-1 text-purple-600" />
                    PLATFORM_ADMIN
                  </Badge>
                ) : (
                  <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200">
                    USER
                  </Badge>
                )}

                {inspectUser.status === 'ACTIVE' ? (
                  <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200">
                    Active
                  </Badge>
                ) : (
                  <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-200">
                    Suspended
                  </Badge>
                )}
              </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center">
                <span className="text-[11px] text-slate-400 font-medium">Workspaces</span>
                <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  {inspectUser.workspaceMemberships?.length ?? 0}
                </p>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center">
                <span className="text-[11px] text-slate-400 font-medium">Projects</span>
                <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  {inspectUser.projectMemberships?.length ?? 0}
                </p>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center">
                <span className="text-[11px] text-slate-400 font-medium">Assigned Tasks</span>
                <p className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                  {inspectUser.taskAssignments?.length ?? 0}
                </p>
              </div>
            </div>

            {/* SECTION 1: WORKSPACES */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                Workspace Memberships & Roles
              </h4>
              {(!inspectUser.workspaceMemberships || inspectUser.workspaceMemberships.length === 0) ? (
                <p className="text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200/60 dark:border-slate-800">
                  User is not currently a member of any workspace.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {inspectUser.workspaceMemberships.map((wm, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">{wm.workspace?.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono">/{wm.workspace?.slug}</p>
                      </div>
                      <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 text-[10px]">
                        {wm.role}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SECTION 2: PROJECTS & ASSIGNED TASKS UNDER EACH PROJECT */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FolderGit2 className="w-3.5 h-3.5 text-indigo-600" />
                Project Roles & Tasks Under Each Project
              </h4>

              {(() => {
                const projectMap = new Map<string, {
                  project: { id: string; name: string; key: string };
                  role?: string;
                  tasks: Array<{
                    id: string;
                    title: string;
                    priority: string;
                    dueDate?: string | null;
                    column?: { id: string; name: string; color?: string | null } | null;
                  }>;
                }>();

                // Add from projectMemberships
                inspectUser.projectMemberships?.forEach((pm) => {
                  projectMap.set(pm.project.id, {
                    project: pm.project,
                    role: pm.role,
                    tasks: [],
                  });
                });

                // Add tasks under corresponding project
                inspectUser.taskAssignments?.forEach((ta) => {
                  const pid = ta.task.projectId || ta.task.project?.id;
                  if (pid) {
                    if (!projectMap.has(pid)) {
                      projectMap.set(pid, {
                        project: ta.task.project,
                        role: 'CONTRIBUTOR',
                        tasks: [],
                      });
                    }
                    projectMap.get(pid)!.tasks.push(ta.task);
                  }
                });

                const projectsList = Array.from(projectMap.values());

                if (projectsList.length === 0) {
                  return (
                    <p className="text-xs text-slate-400 italic bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-200/60 dark:border-slate-800">
                      User has no active projects or assigned tasks.
                    </p>
                  );
                }

                return (
                  <div className="space-y-3">
                    {projectsList.map((entry, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs"
                      >
                        {/* Project Header */}
                        <div className="px-4 py-2.5 bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FolderGit2 className="w-3.5 h-3.5 text-indigo-600" />
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {entry.project.name}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-mono">
                              {entry.project.key}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <Badge className="bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-200 text-[10px]">
                              Role: {entry.role || 'MEMBER'}
                            </Badge>
                            <span className="text-[11px] text-slate-400">
                              {entry.tasks.length} task{entry.tasks.length === 1 ? '' : 's'}
                            </span>
                          </div>
                        </div>

                        {/* Tasks under this project */}
                        <div className="p-3">
                          {entry.tasks.length === 0 ? (
                            <p className="text-[11px] text-slate-400 italic py-1 px-1">
                              No tasks currently assigned to this user in this project.
                            </p>
                          ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                              {entry.tasks.map((t) => (
                                <div
                                  key={t.id}
                                  className="py-2 px-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                                >
                                  <div className="flex items-center gap-2">
                                    <CheckSquare className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                                      {t.title}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    {/* Status / Column */}
                                    {t.column && (
                                      <span
                                        className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                                        style={{
                                          backgroundColor: t.column.color ? `${t.column.color}20` : '#e2e8f0',
                                          color: t.column.color || '#475569',
                                          border: `1px solid ${t.column.color ? `${t.column.color}50` : '#cbd5e1'}`,
                                        }}
                                      >
                                        {t.column.name}
                                      </span>
                                    )}

                                    {/* Priority */}
                                    <span
                                      className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                                        t.priority === 'URGENT'
                                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                          : t.priority === 'HIGH'
                                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                          : t.priority === 'MEDIUM'
                                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                      }`}
                                    >
                                      {t.priority}
                                    </span>

                                    {/* Due Date */}
                                    {t.dueDate && (
                                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(t.dueDate).toLocaleDateString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        ) : null}
      </Modal>

      {/* 6. DELETE USER CONFIRMATION MODAL */}
      <Modal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        size="md"
        title={
          <div className="flex items-center gap-2 text-rose-600">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-bold text-base">Delete User Account</span>
          </div>
        }
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              disabled={isDeleting}
              onClick={() => setUserToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={isDeleting}
              onClick={handleDeleteUser}
              className="bg-rose-600 hover:bg-rose-700 text-white gap-1.5"
            >
              {isDeleting ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Confirm Delete</span>
                </>
              )}
            </Button>
          </div>
        }
      >
        <div className="space-y-3 py-1">
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Are you sure you want to permanently remove this user account?
          </p>

          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60">
            <p className="text-xs font-bold text-rose-900 dark:text-rose-200">
              {userToDelete?.name}
            </p>
            <p className="text-[11px] text-rose-700 dark:text-rose-300 font-mono">
              {userToDelete?.email}
            </p>
          </div>

          <div className="text-[11px] text-slate-500 space-y-1">
            <p className="font-medium text-slate-700 dark:text-slate-300">This action will:</p>
            <ul className="list-disc pl-5 space-y-0.5">
              <li>Revoke all active login sessions and authentication tokens immediately.</li>
              <li>Remove the user from all workspace and project memberships.</li>
              <li>Unassign any active tasks assigned to this user.</li>
              <li>Safely archive records to preserve activity logs and audit integrity.</li>
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  );
};
