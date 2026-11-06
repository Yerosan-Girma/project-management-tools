import React, { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { useAuthStore } from '../../../stores/auth-store';
import { useWorkspaceStore } from '../../../stores/workspace-store';
import { analyticsService } from '../../analytics/services/analytics.service';
import { projectService } from '../../projects/services/project.service';
import { taskService } from '../../tasks/services/task.service';
import { UserDashboardStats } from '../../../types/analytics.types';
import { Project } from '../../../types/project.types';
import { Task } from '../../../types/task.types';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { TaskDetailModal } from '../../tasks/components/TaskDetailModal';

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { currentWorkspace } = useWorkspaceStore();

  const [stats, setStats] = useState<UserDashboardStats | null>(null);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [assignedTasks, setAssignedTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [statsData, tasksData] = await Promise.all([
        analyticsService.getDashboardStats(),
        taskService.getMyTasks({ limit: 5 }),
      ]);
      setStats(statsData);
      setAssignedTasks(tasksData.items || []);

      if (currentWorkspace) {
        const projData = await projectService.getWorkspaceProjects(currentWorkspace.id);
        setRecentProjects(projData.slice(0, 4));
      }
    } catch {
      // Handled silently
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  if (isLoading && !stats) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-2" />
        <span className="text-xs">Loading platform dashboard...</span>
      </div>
    );
  }

  const completionPercent =
    stats && stats.tasks.assignedTotal > 0
      ? Math.round((stats.tasks.completed / stats.tasks.assignedTotal) * 100)
      : 0;

  const chartData = [
    { name: 'Completed', count: stats?.tasks.completed || 0, color: '#10b981' },
    { name: 'Pending', count: stats?.tasks.pending || 0, color: '#6366f1' },
    { name: 'Overdue', count: stats?.tasks.overdue || 0, color: '#f43f5e' },
    { name: 'Due Soon', count: stats?.tasks.upcomingWithin24h || 0, color: '#f59e0b' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-primary-600 via-indigo-600 to-primary-700 text-white shadow-lg">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-primary-200">
            TeamFlow Workspace Overview
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">
            Welcome back, {user?.name || 'Teammate'}!
          </h1>
          <p className="text-xs text-primary-100 mt-1 max-w-xl">
            You have <span className="font-bold underline">{stats?.tasks.pending ?? 0} active tasks</span> pending execution.
            {stats && stats.tasks.overdue > 0 && (
              <span className="ml-1 text-amber-200 font-bold">
                ⚠️ {stats.tasks.overdue} deliverable(s) require urgent attention.
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/projects?create=true">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              New Project
            </Button>
          </Link>
          <Link to="/my-tasks">
            <Button
              variant="outline"
              size="sm"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              My Tasks
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Workspaces */}
        <Card hoverable>
          <CardContent className="pt-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Workspaces</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {stats?.workspacesCount ?? 1}
              </p>
              <span className="text-[11px] text-slate-400">Multi-tenant teams</span>
            </div>
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400">
              <Building2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Projects */}
        <Card hoverable>
          <CardContent className="pt-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Active Projects</span>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {stats?.projects.active ?? 0}
              </p>
              <span className="text-[11px] text-slate-400">
                {stats?.projects.total ?? 0} total enrolled
              </span>
            </div>
            <div className="p-3 rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400">
              <FolderGit2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Tasks Completed / Velocity */}
        <Card hoverable>
          <CardContent className="pt-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Completed Tasks</span>
              <p className="text-2xl font-bold text-emerald-600 mt-1">
                {stats?.tasks.completed ?? 0}
              </p>
              <span className="text-[11px] text-emerald-600 font-semibold">
                {completionPercent}% completion velocity
              </span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        {/* Overdue */}
        <Card hoverable className={stats && stats.tasks.overdue > 0 ? 'border-rose-300 dark:border-rose-900' : ''}>
          <CardContent className="pt-4 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium">Overdue Alerts</span>
              <p className="text-2xl font-bold text-rose-600 mt-1">
                {stats?.tasks.overdue ?? 0}
              </p>
              <span className="text-[11px] text-slate-400">
                {stats?.tasks.upcomingWithin24h ?? 0} due today
              </span>
            </div>
            <div className="p-3 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Priority Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deliverables Distribution Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Task Velocity Breakdown</CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">Assigned workload status across active sprints</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-semibold">
              <TrendingUp className="w-4 h-4" />
              <span>Real-Time Sync</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Progress Gauge & Deadlines */}
        <Card className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="text-base">Sprint Completion</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center py-4">
              <div className="text-5xl font-extrabold text-primary-600 dark:text-primary-400">
                {completionPercent}%
              </div>
              <p className="text-xs text-slate-500 mt-2">Overall deliverables finished</p>
            </div>

            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Upcoming within 24 hours</span>
                <Badge variant={stats && stats.tasks.upcomingWithin24h > 0 ? 'warning' : 'outline'} size="sm">
                  {stats?.tasks.upcomingWithin24h ?? 0}
                </Badge>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Total assigned to you</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {stats?.tasks.assignedTotal ?? 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section: Active Projects & Immediate Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Projects */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Workspace Projects</CardTitle>
            <Link to="/projects">
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentProjects.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                No projects yet in this workspace.
              </p>
            ) : (
              recentProjects.map((p) => (
                <div key={p.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {p.key}
                      </span>
                      <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {p.name}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {p._count?.tasks ?? 0} tasks • Priority: {p.priority}
                    </p>
                  </div>

                  <Link to={`/projects/${p.id}`}>
                    <Button size="sm" variant="outline" leftIcon={<Kanban className="w-3 h-3" />}>
                      Board
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* My Immediate Deliverables */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Assigned to Me</CardTitle>
            <Link to="/my-tasks">
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                View All
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="divide-y divide-slate-100 dark:divide-slate-800">
            {assignedTasks.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                You have no pending assigned tasks!
              </p>
            ) : (
              assignedTasks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    setSelectedTaskId(t.id);
                    setIsTaskModalOpen(true);
                  }}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 p-2 -mx-2 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                      {t.title}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                      {t.dueDate && (
                        <span className="flex items-center gap-1 text-slate-500">
                          <Clock className="w-3 h-3" />
                          {new Date(t.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                      <span>•</span>
                      <span>Priority: {t.priority}</span>
                    </div>
                  </div>

                  <Badge variant={t.priority === 'URGENT' ? 'danger' : 'default'} size="sm">
                    {t.priority}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Task Detail Modal */}
      <TaskDetailModal
        taskId={selectedTaskId}
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setSelectedTaskId(null);
        }}
        onTaskUpdated={loadDashboardData}
        onTaskDeleted={loadDashboardData}
      />
    </div>
  );
};

export default DashboardPage;
