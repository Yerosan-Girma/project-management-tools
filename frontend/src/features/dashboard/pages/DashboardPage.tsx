import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  FolderGit2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  Plus,
  Kanban,
  Loader2,
  TrendingUp,
  Search,
  Filter,
  Users,
  Target,
  Flame,
  CheckSquare,
  Square,
  Sparkles,
  Activity,
  ChevronRight,
  BarChart3,
  UserPlus,
  RotateCw,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import { toast } from 'sonner';
import { useAuthStore } from '../../../stores/auth-store';
import { useWorkspaceStore } from '../../../stores/workspace-store';
import { analyticsService } from '../../analytics/services/analytics.service';
import { projectService } from '../../projects/services/project.service';
import { taskService } from '../../tasks/services/task.service';
import { workspaceService } from '../../workspaces/services/workspace.service';
import { activityService } from '../../activities/services/activity.service';
import { boardService } from '../../boards/services/board.service';
import { UserDashboardStats } from '../../../types/analytics.types';
import { Project } from '../../../types/project.types';
import { Task } from '../../../types/task.types';
import { WorkspaceMember } from '../../../types/workspace.types';
import { ActivityLog } from '../../../types/activity.types';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Avatar } from '../../../components/ui/Avatar';
import { Input } from '../../../components/ui/Input';
import { TaskDetailModal } from '../../tasks/components/TaskDetailModal';
import { CreateProjectModal } from '../../projects/components/CreateProjectModal';
import { InviteMemberModal } from '../../workspaces/components/InviteMemberModal';
import { QuickCreateTaskModal } from '../components/QuickCreateTaskModal';
import { PlatformAdminConsole } from '../components/PlatformAdminConsole';
import { PendingInvitationsBanner } from '../../invitations/components/PendingInvitationsBanner';

type TaskFilterType = 'ALL' | 'PENDING' | 'DUE_SOON' | 'URGENT' | 'OVERDUE' | 'COMPLETED';
type AnalyticsTab = 'VELOCITY' | 'STATUS' | 'PRIORITY';
type ViewMode = 'PLATFORM_ADMIN' | 'MY_FOCUS' | 'TEAM_OVERVIEW';

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { currentWorkspace, workspaces, setCurrentWorkspace } = useWorkspaceStore();

  // Data states
  const [stats, setStats] = useState<UserDashboardStats | null>(null);
  const [workspaceProjects, setWorkspaceProjects] = useState<Project[]>([]);
  const [assignedTasks, setAssignedTasks] = useState<Task[]>([]);
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);
  const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isPlatformAdmin = user?.platformRole === 'PLATFORM_ADMIN';

  // View & Interactive controls
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('view') === 'PLATFORM_ADMIN' || user?.platformRole === 'PLATFORM_ADMIN') {
      return 'PLATFORM_ADMIN';
    }
    return 'MY_FOCUS';
  });
  const [analyticsTab, setAnalyticsTab] = useState<AnalyticsTab>('VELOCITY');
  const [taskFilter, setTaskFilter] = useState<TaskFilterType>('ALL');
  const [taskSearch, setTaskSearch] = useState('');

  // Modals
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isInviteMemberOpen, setIsInviteMemberOpen] = useState(false);

  // Time-aware greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good morning', icon: '☀️' };
    if (hour < 18) return { text: 'Good afternoon', icon: '⛅' };
    return { text: 'Good evening', icon: '🌙' };
  }, []);

  // Determine user role badge in active workspace
  const userWorkspaceRole = useMemo(() => {
    if (user?.platformRole === 'PLATFORM_ADMIN') return 'Platform Admin';
    if (!currentWorkspace) return 'Member';
    if (currentWorkspace.ownerId === user?.id) return 'Workspace Owner';
    const member = workspaceMembers.find((m) => m.userId === user?.id);
    if (member?.role === 'ADMIN') return 'Workspace Admin';
    if (member?.role === 'MEMBER') return 'Team Member';
    if (member?.role === 'GUEST') return 'Guest / Viewer';
    return stats?.userRole || 'Team Member';
  }, [user, currentWorkspace, workspaceMembers, stats?.userRole]);

  const isOwnerOrAdmin = useMemo(() => {
    if (user?.platformRole === 'PLATFORM_ADMIN') return true;
    if (currentWorkspace && currentWorkspace.ownerId === user?.id) return true;
    const member = workspaceMembers.find((m) => m.userId === user?.id);
    return member?.role === 'ADMIN' || Boolean(stats?.isWorkspaceAdminOrOwner);
  }, [user, currentWorkspace, workspaceMembers, stats?.isWorkspaceAdminOrOwner]);

  // Load dashboard data and ignore stale responses after workspace changes/unmounts.
  const loadDashboardData = useCallback(async (showRefreshingState = false) => {
    if (showRefreshingState) setIsRefreshing(true);
    else setIsLoading(true);

    const activeWsId = currentWorkspace?.id;
    const isCurrentWorkspace = () => useWorkspaceStore.getState().currentWorkspace?.id === activeWsId;
    try {
      // Core content is parallelized. Secondary workspace panels load independently so their
      // slower responses do not hold the useful dashboard metrics and assigned tasks hostage.
      const [statsData, tasksRes] = await Promise.all([
        analyticsService.getDashboardStats(activeWsId),
        taskService.getMyTasks({ workspaceId: activeWsId })
      ]);
      if (!isCurrentWorkspace()) return;

      setStats(statsData);
      const parsedTasks: Task[] = Array.isArray(tasksRes)
        ? tasksRes
        : (tasksRes as any)?.items || [];
      setAssignedTasks(parsedTasks);
      setIsLoading(false);

      if (!activeWsId) return;
      const secondaryData = Promise.all([
        projectService.getWorkspaceProjects(activeWsId).catch(() => []),
        workspaceService.getMembers(activeWsId, { limit: 12 }).catch(() => null),
        activityService.getWorkspaceActivities(activeWsId, { limit: 8 }).catch(() => null)
      ]);
      void secondaryData.then(([projData, membersData, activitiesData]) => {
        if (!isCurrentWorkspace()) return;
        setWorkspaceProjects(projData);
        if (membersData && membersData.items) setWorkspaceMembers(membersData.items);
        else if (Array.isArray(membersData)) setWorkspaceMembers(membersData);
        if (activitiesData && activitiesData.items) setRecentActivities(activitiesData.items);
        else if (Array.isArray(activitiesData)) setRecentActivities(activitiesData);
      });
    } catch (err) {
      if (isCurrentWorkspace()) console.error('Failed to load dashboard data:', err);
    } finally {
      if (isCurrentWorkspace()) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [currentWorkspace?.id]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Quick toggle task completion directly from dashboard
  const handleToggleTaskCompleted = async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const isCurrentlyCompleted = Boolean(task.column?.isCompletedColumn || task.completedAt);

      // Find columns for this project to get target column
      const boards = await boardService.getProjectBoards(task.projectId);
      if (!boards.length || !boards[0].columns || !boards[0].columns.length) {
        toast.info('Cannot change column state for this project.');
        return;
      }

      const columns = boards[0].columns;
      let targetColumnId: string;

      if (!isCurrentlyCompleted) {
        // Find completed column or last column
        const completedCol = columns.find((c) => c.isCompletedColumn) || columns[columns.length - 1];
        targetColumnId = completedCol.id;
      } else {
        // Move back to first non-completed column (e.g. To Do / In Progress)
        const todoCol = columns.find((c) => !c.isCompletedColumn) || columns[0];
        targetColumnId = todoCol.id;
      }

      // Optimistic update in UI
      setAssignedTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? ({
                ...t,
                completedAt: !isCurrentlyCompleted ? new Date().toISOString() : null,
                column: {
                  ...t.column,
                  id: targetColumnId,
                  name: !isCurrentlyCompleted ? 'Completed' : 'In Progress',
                  isCompletedColumn: !isCurrentlyCompleted,
                } as any,
              } as Task)
            : t
        )
      );

      await taskService.updateTask(task.id, { boardColumnId: targetColumnId });

      toast.success(
        !isCurrentlyCompleted
          ? `Great job! "${task.title}" marked as completed. 🎉`
          : `Task reopened: "${task.title}"`
      );

      // Refresh stats quietly
      analyticsService.getDashboardStats(currentWorkspace?.id).then((freshStats) => {
        setStats(freshStats);
      });
    } catch (err) {
      toast.error('Failed to update task status.');
      loadDashboardData();
    }
  };

  // Filtered tasks based on search and active filter tab
  const filteredTasks = useMemo(() => {
    const now = Date.now();
    const oneDayFromNow = now + 24 * 60 * 60 * 1000;

    return assignedTasks.filter((task) => {
      // Search query
      if (taskSearch.trim()) {
        const query = taskSearch.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesProject = task.project?.name?.toLowerCase().includes(query) || false;
        if (!matchesTitle && !matchesProject) return false;
      }

      const isCompleted = Boolean(task.column?.isCompletedColumn || task.completedAt);
      const isOverdue =
        !isCompleted && task.dueDate && new Date(task.dueDate).getTime() < now;
      const isDueSoon =
        !isCompleted &&
        task.dueDate &&
        new Date(task.dueDate).getTime() >= now &&
        new Date(task.dueDate).getTime() <= oneDayFromNow;

      switch (taskFilter) {
        case 'PENDING':
          return !isCompleted;
        case 'COMPLETED':
          return isCompleted;
        case 'OVERDUE':
          return isOverdue;
        case 'DUE_SOON':
          return isDueSoon;
        case 'URGENT':
          return !isCompleted && task.priority === 'URGENT';
        case 'ALL':
        default:
          return true;
      }
    });
  }, [assignedTasks, taskFilter, taskSearch]);

  // Derived metrics
  const completionPercent = useMemo(() => {
    if (!stats) return 0;
    if (viewMode === 'MY_FOCUS') {
      return stats.tasks.assignedTotal > 0
        ? Math.round((stats.tasks.completed / stats.tasks.assignedTotal) * 100)
        : 0;
    } else {
      return stats.teamStats?.completionPercentage ?? 0;
    }
  }, [stats, viewMode]);

  // Chart data for Velocity
  const velocityChartData = useMemo(() => {
    if (viewMode === 'MY_FOCUS') {
      return [
        { name: 'Completed', count: stats?.tasks.completed || 0, color: '#10b981' },
        { name: 'Pending', count: stats?.tasks.pending || 0, color: '#6366f1' },
        { name: 'Due Soon', count: stats?.tasks.upcomingWithin24h || 0, color: '#f59e0b' },
        { name: 'Overdue', count: stats?.tasks.overdue || 0, color: '#f43f5e' },
      ];
    } else {
      return [
        { name: 'Team Completed', count: stats?.teamStats?.completedTasks || 0, color: '#10b981' },
        { name: 'Team Pending', count: stats?.teamStats?.pendingTasks || 0, color: '#3b82f6' },
        { name: 'Team Overdue', count: stats?.teamStats?.overdueTasks || 0, color: '#f43f5e' },
      ];
    }
  }, [stats, viewMode]);

  // Status Distribution Pie Data
  const statusPieData = useMemo(() => {
    if (viewMode === 'MY_FOCUS') {
      const completed = stats?.tasks.completed || 0;
      const pending = stats?.tasks.pending || 0;
      const overdue = stats?.tasks.overdue || 0;
      const total = completed + pending;
      if (total === 0) return [{ name: 'No Tasks', value: 1, color: '#94a3b8' }];
      return [
        { name: 'Completed', value: completed, color: '#10b981' },
        { name: 'In Flight', value: Math.max(0, pending - overdue), color: '#6366f1' },
        { name: 'Overdue', value: overdue, color: '#f43f5e' },
      ].filter((d) => d.value > 0);
    } else {
      const completed = stats?.teamStats?.completedTasks || 0;
      const pending = stats?.teamStats?.pendingTasks || 0;
      const overdue = stats?.teamStats?.overdueTasks || 0;
      const total = completed + pending;
      if (total === 0) return [{ name: 'No Tasks', value: 1, color: '#94a3b8' }];
      return [
        { name: 'Completed', value: completed, color: '#10b981' },
        { name: 'In Progress', value: Math.max(0, pending - overdue), color: '#3b82f6' },
        { name: 'Overdue', value: overdue, color: '#f43f5e' },
      ].filter((d) => d.value > 0);
    }
  }, [stats, viewMode]);

  // Priority Distribution Data
  const priorityData = useMemo(() => {
    const dist = stats?.priorityDistribution || { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 };
    const total = Object.values(dist).reduce((acc, curr) => acc + curr, 0) || 1;
    return [
      { level: 'URGENT', label: 'Urgent', count: dist.URGENT || 0, color: 'bg-rose-500', barColor: '#f43f5e', percent: Math.round(((dist.URGENT || 0) / total) * 100) },
      { level: 'HIGH', label: 'High', count: dist.HIGH || 0, color: 'bg-amber-500', barColor: '#f59e0b', percent: Math.round(((dist.HIGH || 0) / total) * 100) },
      { level: 'MEDIUM', label: 'Medium', count: dist.MEDIUM || 0, color: 'bg-indigo-500', barColor: '#6366f1', percent: Math.round(((dist.MEDIUM || 0) / total) * 100) },
      { level: 'LOW', label: 'Low', count: dist.LOW || 0, color: 'bg-emerald-500', barColor: '#10b981', percent: Math.round(((dist.LOW || 0) / total) * 100) },
    ];
  }, [stats?.priorityDistribution]);

  // Initial loader
  if (isLoading && !stats) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
        <div className="p-4 rounded-2xl bg-primary-50 dark:bg-primary-950/60 mb-3 animate-pulse">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 dark:text-primary-400" />
        </div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Personalizing your workspace dashboard...
        </p>
        <span className="text-xs text-slate-400 mt-1">
          Loading assigned deliverables & real-time metrics
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-7 pb-10">
      {/* Pending Invitations Banner */}
      <PendingInvitationsBanner onProcessed={loadDashboardData} />

      {/* 0. PLATFORM SUPERADMIN CONTROL SWITCHER */}
      {isPlatformAdmin && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-2xl bg-purple-50/90 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300 px-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              Role View Mode:
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setViewMode('PLATFORM_ADMIN')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  viewMode === 'PLATFORM_ADMIN'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'text-purple-700 dark:text-purple-300 hover:bg-purple-100/70 dark:hover:bg-purple-900/40'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Platform Superadmin Control</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('MY_FOCUS')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  viewMode === 'MY_FOCUS'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
                <span>Workspace My Tasks</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('TEAM_OVERVIEW')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  viewMode === 'TEAM_OVERVIEW'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FolderGit2 className="w-3.5 h-3.5" />
                <span>Workspace Projects & Team</span>
              </button>
            </div>
          </div>

          <Badge className="bg-purple-200/80 text-purple-900 dark:bg-purple-900 dark:text-purple-200 text-[10px] font-bold">
            Root Authority
          </Badge>
        </div>
      )}

      {viewMode === 'PLATFORM_ADMIN' ? (
        <PlatformAdminConsole />
      ) : (
        <>
          {/* 1. TOP INTERACTIVE HERO & WELCOME BANNER */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-700 via-primary-700 to-indigo-900 text-white shadow-xl shadow-indigo-950/10 border border-white/10 p-6 sm:p-8">
        {/* Subtle background decorative glow rings */}
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="absolute right-1/3 -bottom-10 w-48 h-48 rounded-full bg-indigo-400/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            {/* Top Chip: Role & Workspace Indicator */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-md text-white border border-white/20">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{userWorkspaceRole}</span>
              </span>

              {currentWorkspace && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-black/20 text-indigo-100 border border-white/10">
                  <Building2 className="w-3.5 h-3.5 text-indigo-300" />
                  <span className="truncate max-w-[180px]">{currentWorkspace.name}</span>
                </span>
              )}

              {isRefreshing && (
                <span className="inline-flex items-center gap-1 text-[11px] text-indigo-200 animate-pulse">
                  <RotateCw className="w-3 h-3 animate-spin" />
                  <span>Syncing...</span>
                </span>
              )}
            </div>

            {/* Personalized Heading */}
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <span>
                {greeting.text}, {user?.name || 'Teammate'} {greeting.icon}
              </span>
            </h1>

            {/* Contextual Status Summary */}
            <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed">
              {stats?.tasks.overdue && stats.tasks.overdue > 0 ? (
                <span>
                  You have <span className="font-bold text-amber-300">{stats.tasks.overdue} overdue deliverable(s)</span> requiring immediate action.
                </span>
              ) : stats?.tasks.pending && stats.tasks.pending > 0 ? (
                <span>
                  You have <span className="font-bold text-emerald-300">{stats.tasks.pending} active tasks</span> lined up across your sprint deliverables.
                </span>
              ) : (
                <span>
                  All your assigned tasks are up to date! Great momentum today. 🎯
                </span>
              )}
              {stats?.tasks.upcomingWithin24h ? (
                <span className="block mt-0.5 text-indigo-200 text-xs">
                  ⏰ {stats.tasks.upcomingWithin24h} item(s) due within the next 24 hours.
                </span>
              ) : null}
            </p>
          </div>

          {/* Action Hub */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setIsCreateTaskOpen(true)}
              className="bg-white text-indigo-950 hover:bg-slate-100 shadow-md font-semibold"
            >
              New Task
            </Button>

            {isOwnerOrAdmin && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<FolderGit2 className="w-4 h-4" />}
                  onClick={() => setIsCreateProjectOpen(true)}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                >
                  New Project
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<UserPlus className="w-4 h-4" />}
                  onClick={() => setIsInviteMemberOpen(true)}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20"
                >
                  Invite
                </Button>
              </>
            )}

            <button
              onClick={() => loadDashboardData(true)}
              title="Refresh dashboard metrics"
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all hover:rotate-180"
            >
              <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. DASHBOARD VIEW MODE SEGMENTED CONTROL & WORKSPACE SWITCHER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-2 sm:p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        {/* Toggle Mode: My Focus vs Team Workspace Overview */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('MY_FOCUS')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'MY_FOCUS'
                ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>My Focus</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300">
              {stats?.tasks.assignedTotal ?? 0}
            </span>
          </button>

          <button
            onClick={() => setViewMode('TEAM_OVERVIEW')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === 'TEAM_OVERVIEW'
                ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Team & Workspace</span>
            {stats?.teamStats && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                {stats.teamStats.totalTasks}
              </span>
            )}
          </button>
        </div>

        {/* Quick Workspace Switcher Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">
            Active Workspace:
          </span>
          <select
            value={currentWorkspace?.id || ''}
            onChange={(e) => {
              const selected = workspaces.find((w) => w.id === e.target.value);
              if (selected) {
                setCurrentWorkspace(selected);
              }
            }}
            className="text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 px-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-primary-500"
          >
            {workspaces.map((ws) => (
              <option key={ws.id} value={ws.id}>
                {ws.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. INTERACTIVE KPI CARDS ROW (Clickable to Filter Tasks Below) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Assigned Total / Workspace Total */}
        <div
          onClick={() => setTaskFilter('ALL')}
          className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
            taskFilter === 'ALL'
              ? 'bg-primary-50/80 border-primary-300 dark:bg-primary-950/40 dark:border-primary-800 ring-2 ring-primary-500/20'
              : 'bg-white border-slate-200/80 dark:bg-slate-900 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {viewMode === 'MY_FOCUS' ? 'Assigned to Me' : 'Workspace Tasks'}
            </span>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {viewMode === 'MY_FOCUS'
                ? stats?.tasks.assignedTotal ?? 0
                : stats?.teamStats?.totalTasks ?? 0}
            </span>
            <span className="text-xs text-slate-400">items</span>
          </div>
          <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mt-1 font-medium flex items-center gap-1">
            <span>Filter by all</span>
            <ArrowRight className="w-3 h-3" />
          </p>
        </div>

        {/* KPI 2: Completed / Velocity */}
        <div
          onClick={() => setTaskFilter('COMPLETED')}
          className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
            taskFilter === 'COMPLETED'
              ? 'bg-emerald-50/80 border-emerald-300 dark:bg-emerald-950/40 dark:border-emerald-800 ring-2 ring-emerald-500/20'
              : 'bg-white border-slate-200/80 dark:bg-slate-900 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {viewMode === 'MY_FOCUS' ? 'Completed Work' : 'Team Completed'}
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {viewMode === 'MY_FOCUS'
                ? stats?.tasks.completed ?? 0
                : stats?.teamStats?.completedTasks ?? 0}
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {completionPercent}% velocity
            </span>
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-medium flex items-center gap-1">
            <span>View completed</span>
            <ArrowRight className="w-3 h-3" />
          </p>
        </div>

        {/* KPI 3: In Flight / Pending */}
        <div
          onClick={() => setTaskFilter('PENDING')}
          className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
            taskFilter === 'PENDING'
              ? 'bg-blue-50/80 border-blue-300 dark:bg-blue-950/40 dark:border-blue-800 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200/80 dark:bg-slate-900 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {viewMode === 'MY_FOCUS' ? 'Active In Flight' : 'Team In Progress'}
            </span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">
              {viewMode === 'MY_FOCUS'
                ? stats?.tasks.pending ?? 0
                : stats?.teamStats?.pendingTasks ?? 0}
            </span>
            <span className="text-xs text-slate-400">pending</span>
          </div>
          <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-1 font-medium flex items-center gap-1">
            <span>Filter pending</span>
            <ArrowRight className="w-3 h-3" />
          </p>
        </div>

        {/* KPI 4: Overdue & Urgent Alerts */}
        <div
          onClick={() => setTaskFilter('OVERDUE')}
          className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
            taskFilter === 'OVERDUE'
              ? 'bg-rose-50/80 border-rose-300 dark:bg-rose-950/40 dark:border-rose-800 ring-2 ring-rose-500/20'
              : stats && stats.tasks.overdue > 0
              ? 'bg-white border-rose-200 dark:bg-slate-900 dark:border-rose-900/60'
              : 'bg-white border-slate-200/80 dark:bg-slate-900 dark:border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {viewMode === 'MY_FOCUS' ? 'Overdue Alerts' : 'Team Overdue'}
            </span>
            <div
              className={`p-2.5 rounded-xl ${
                stats && (viewMode === 'MY_FOCUS' ? stats.tasks.overdue : stats.teamStats?.overdueTasks ?? 0) > 0
                  ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 animate-pulse'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span
              className={`text-3xl font-extrabold ${
                stats && (viewMode === 'MY_FOCUS' ? stats.tasks.overdue : stats.teamStats?.overdueTasks ?? 0) > 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-slate-900 dark:text-white'
              }`}
            >
              {viewMode === 'MY_FOCUS'
                ? stats?.tasks.overdue ?? 0
                : stats?.teamStats?.overdueTasks ?? 0}
            </span>
            <span className="text-xs text-slate-400">critical</span>
          </div>
          <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-medium flex items-center gap-1">
            <span>Filter urgent / overdue</span>
            <ArrowRight className="w-3 h-3" />
          </p>
        </div>
      </div>

      {/* 4. INTERACTIVE VISUALIZATIONS & SPRINT COMPLETION RADIAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Analytics Card with Tabs */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                <span>Deliverables & Sprint Analytics</span>
              </CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                {viewMode === 'MY_FOCUS'
                  ? 'Interactive breakdown of your personal tasks'
                  : 'Aggregated velocity across active workspace projects'}
              </p>
            </div>

            {/* Sub-Tabs: Velocity | Status Distribution | Priority */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs">
              <button
                onClick={() => setAnalyticsTab('VELOCITY')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  analyticsTab === 'VELOCITY'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Velocity
              </button>
              <button
                onClick={() => setAnalyticsTab('STATUS')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  analyticsTab === 'STATUS'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Stages
              </button>
              <button
                onClick={() => setAnalyticsTab('PRIORITY')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  analyticsTab === 'PRIORITY'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                Priority
              </button>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            {analyticsTab === 'VELOCITY' && (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={velocityChartData} margin={{ top: 15, right: 10, left: -20, bottom: 0 }}>
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={{ stroke: '#e2e8f0' }}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11, fill: '#64748b' }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white px-3 py-2 rounded-xl text-xs shadow-xl border border-slate-700">
                              <p className="font-semibold">{data.name}</p>
                              <p className="text-primary-300 mt-0.5">{data.count} tasks</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={48}>
                      {velocityChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {analyticsTab === 'STATUS' && (
              <div className="h-64 w-full flex flex-col sm:flex-row items-center justify-around">
                <div className="h-56 w-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                      >
                        {statusPieData.map((entry, index) => (
                          <Cell key={`pie-cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2.5 text-xs">
                  {statusPieData.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="font-medium text-slate-700 dark:text-slate-300">{item.name}:</span>
                      <span className="font-bold text-slate-900 dark:text-white">{item.value} tasks</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analyticsTab === 'PRIORITY' && (
              <div className="h-64 w-full flex flex-col justify-center space-y-4 px-2 sm:px-6">
                {priorityData.map((p) => (
                  <div key={p.level} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${p.color}`} />
                        {p.label}
                      </span>
                      <span className="text-slate-500 font-mono">
                        {p.count} tasks ({p.percent}%)
                      </span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${p.color}`}
                        style={{ width: `${Math.max(p.percent, p.count > 0 ? 4 : 0)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sprint Completion Gauge & Velocity Card */}
        <Card className="flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span>Sprint Health & Velocity</span>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Visual Ring / Gauge */}
            <div className="text-center py-2 flex flex-col items-center justify-center">
              <div className="relative w-36 h-36 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100 dark:text-slate-800"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-primary-600 dark:text-primary-400 transition-all duration-1000 ease-out"
                    strokeDasharray={`${completionPercent}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                    {completionPercent}%
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">COMPLETED</span>
                </div>
              </div>

              <p className="text-xs text-slate-500 mt-2 font-medium">
                {completionPercent >= 75
                  ? '🚀 Outstanding velocity! Well ahead of milestone targets.'
                  : completionPercent >= 40
                  ? '⚡ Steady sprint momentum. On track for delivery.'
                  : '🌱 Sprint in progress. Tackle urgent tasks first.'}
              </p>
            </div>

            {/* Quick stats list */}
            <div className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Upcoming within 24h</span>
                <Badge
                  variant={stats && stats.tasks.upcomingWithin24h > 0 ? 'warning' : 'outline'}
                  size="sm"
                >
                  {stats?.tasks.upcomingWithin24h ?? 0} tasks
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">
                  {viewMode === 'MY_FOCUS' ? 'Personal tasks active' : 'Workspace total active'}
                </span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {viewMode === 'MY_FOCUS'
                    ? stats?.tasks.pending ?? 0
                    : stats?.teamStats?.pendingTasks ?? 0}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Workspace active projects</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {stats?.projects.active ?? 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 5. INTERACTIVE TASK DELIVERABLES HUB (The Main Focus for Users) */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                <span>Assigned Deliverables</span>
              </CardTitle>
              <Badge variant="primary" size="sm">
                {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
              </Badge>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any task to inspect details or check the box to mark complete
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="w-full sm:w-56">
              <Input
                placeholder="Search tasks..."
                value={taskSearch}
                onChange={(e) => setTaskSearch(e.target.value)}
                startIcon={<Search className="w-3.5 h-3.5 text-slate-400" />}
                className="py-1 text-xs"
              />
            </div>

            {/* Quick Add Task button */}
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setIsCreateTaskOpen(true)}
              className="text-xs"
            >
              Add Task
            </Button>
          </div>
        </CardHeader>

        {/* Filter Pills Bar */}
        <div className="px-6 py-2.5 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-1.5 overflow-x-auto">
          <span className="text-[11px] font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            <span>Filter:</span>
          </span>

          {(
            [
              { key: 'ALL', label: 'All Tasks' },
              { key: 'PENDING', label: 'In Flight' },
              { key: 'DUE_SOON', label: '⏰ Due Soon' },
              { key: 'URGENT', label: '🔥 Urgent' },
              { key: 'OVERDUE', label: '⚠️ Overdue' },
              { key: 'COMPLETED', label: '✅ Completed' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setTaskFilter(tab.key)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                taskFilter === tab.key
                  ? 'bg-primary-600 text-white font-semibold shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Task List */}
        <CardContent className="p-0 divide-y divide-slate-100 dark:divide-slate-800">
          {filteredTasks.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mb-3">
                <CheckSquare className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {taskSearch ? 'No tasks matching your search' : 'No deliverables in this view'}
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {taskSearch
                  ? 'Try adjusting your search keywords or resetting the filter.'
                  : 'You have no assigned tasks under this filter tab.'}
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                {taskSearch && (
                  <Button variant="outline" size="sm" onClick={() => setTaskSearch('')}>
                    Clear search
                  </Button>
                )}
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => setIsCreateTaskOpen(true)}
                >
                  Create New Task
                </Button>
              </div>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const isCompleted = Boolean(task.column?.isCompletedColumn || task.completedAt);
              const isOverdue =
                !isCompleted &&
                task.dueDate &&
                new Date(task.dueDate).getTime() < Date.now();

              return (
                <div
                  key={task.id}
                  onClick={() => {
                    setSelectedTaskId(task.id);
                    setIsTaskModalOpen(true);
                  }}
                  className={`p-4 flex items-center justify-between gap-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors group ${
                    isCompleted ? 'opacity-65' : ''
                  }`}
                >
                  {/* Left: Quick Completion Checkbox + Title + Project */}
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={(e) => handleToggleTaskCompleted(task, e)}
                      title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                      className="shrink-0 text-slate-400 hover:text-primary-600 transition-colors"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-100 dark:fill-emerald-950" />
                      ) : (
                        <Square className="w-5 h-5 group-hover:border-primary-500" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        {task.project?.key && (
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {task.project.key}
                          </span>
                        )}
                        {task.project?.name && (
                          <span className="text-[11px] text-slate-400 truncate max-w-xs">
                            {task.project.name}
                          </span>
                        )}
                        {task.column?.name && (
                          <span
                            className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                            style={{
                              backgroundColor: `${task.column.color || '#3b82f6'}15`,
                              color: task.column.color || '#3b82f6',
                            }}
                          >
                            {task.column.name}
                          </span>
                        )}
                      </div>

                      <h4
                        className={`text-sm font-semibold truncate ${
                          isCompleted
                            ? 'line-through text-slate-400'
                            : 'text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400'
                        }`}
                      >
                        {task.title}
                      </h4>
                    </div>
                  </div>

                  {/* Right: Priority, Due Date, and chevron */}
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge
                      variant={
                        task.priority === 'URGENT'
                          ? 'danger'
                          : task.priority === 'HIGH'
                          ? 'warning'
                          : task.priority === 'MEDIUM'
                          ? 'primary'
                          : 'default'
                      }
                      size="sm"
                    >
                      {task.priority}
                    </Badge>

                    {task.dueDate && (
                      <span
                        className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-md ${
                          isOverdue
                            ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400'
                            : 'text-slate-500 bg-slate-100/60 dark:bg-slate-800/60'
                        }`}
                      >
                        <Clock className={`w-3 h-3 ${isOverdue ? 'animate-pulse' : ''}`} />
                        <span>
                          {new Date(task.dueDate).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </span>
                    )}

                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* 6. BOTTOM ROW: WORKSPACE PROJECTS & LIVE ACTIVITY STREAM */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Workspace Projects Showcase */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-primary-600 dark:text-primary-400" />
                <span>Workspace Projects</span>
              </CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">Active sprint roadmaps and kanban boards</p>
            </div>

            <div className="flex items-center gap-2">
              <Link to="/projects">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>

          <CardContent className="divide-y divide-slate-100 dark:divide-slate-800 p-0">
            {workspaceProjects.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-xs text-slate-400 mb-3">No projects enrolled in this workspace yet.</p>
                {isOwnerOrAdmin && (
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                    onClick={() => setIsCreateProjectOpen(true)}
                  >
                    Create First Project
                  </Button>
                )}
              </div>
            ) : (
              workspaceProjects.slice(0, 5).map((project) => {
                const totalTasks = project._count?.tasks ?? 0;
                return (
                  <div
                    key={project.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                          {project.key}
                        </span>
                        <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {project.name}
                        </h4>
                        <Badge
                          variant={project.status === 'ACTIVE' ? 'success' : 'default'}
                          size="sm"
                        >
                          {project.status}
                        </Badge>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                        {project.description || `${totalTasks} deliverables tracked`}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <Link to={`/projects/${project.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          leftIcon={<Kanban className="w-3.5 h-3.5 text-primary-600" />}
                          className="text-xs"
                        >
                          Board
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Live Workspace Activity Feed */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-500" />
                <span>Live Workspace Stream</span>
              </CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">Real-time team activities and updates</p>
            </div>
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Live Sync</span>
            </span>
          </CardHeader>

          <CardContent className="divide-y divide-slate-100 dark:divide-slate-800 p-0">
            {recentActivities.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No recent workspace actions logged yet.
              </div>
            ) : (
              recentActivities.slice(0, 5).map((act) => (
                <div key={act.id} className="p-3.5 flex items-start gap-3 text-xs">
                  <Avatar
                    name={act.actor?.name || 'Teammate'}
                    src={act.actor?.avatarUrl || undefined}
                    size="sm"
                    className="shrink-0 mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-slate-800 dark:text-slate-200">
                      <span className="font-semibold">{act.actor?.name || 'Teammate'}</span>{' '}
                      <span className="text-slate-500">
                        {act.action === 'PROJECT_CREATED'
                          ? 'created new project'
                          : act.action === 'TASK_CREATED'
                          ? 'created a new task'
                          : act.action === 'TASK_MOVED'
                          ? 'updated deliverable status'
                          : act.action === 'COMMENT_ADDED'
                          ? 'commented on task'
                          : act.action.toLowerCase().replace(/_/g, ' ')}
                      </span>{' '}
                      {act.project?.name && (
                        <span className="font-medium text-primary-600 dark:text-primary-400">
                          in {act.project.name}
                        </span>
                      )}
                    </p>
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      {new Date(act.createdAt).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                      {' • '}
                      {new Date(act.createdAt).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
      </>
      )}

      {/* 7. MODALS */}
      {/* Task Detail Modal */}
      <TaskDetailModal
        taskId={selectedTaskId}
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTaskId(null);
        }}
        onTaskUpdated={() => loadDashboardData(false)}
        onTaskDeleted={() => loadDashboardData(false)}
      />

      {/* Quick Create Task Modal */}
      <QuickCreateTaskModal
        isOpen={isCreateTaskOpen}
        onClose={() => setIsCreateTaskOpen(false)}
        projects={workspaceProjects}
        onCreated={() => loadDashboardData(false)}
        currentUserId={user?.id}
      />

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateProjectOpen}
        onClose={() => setIsCreateProjectOpen(false)}
        onCreated={() => loadDashboardData(false)}
      />

      {/* Invite Member Modal */}
      {currentWorkspace && (
        <InviteMemberModal
          isOpen={isInviteMemberOpen}
          onClose={() => setIsInviteMemberOpen(false)}
          workspaceId={currentWorkspace.id}
          onInvited={() => loadDashboardData(false)}
        />
      )}
    </div>
  );
};

export default DashboardPage;
