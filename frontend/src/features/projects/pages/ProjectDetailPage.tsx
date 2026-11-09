import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Kanban,
  BarChart2,
  Users,
  History,
  Settings,
  Loader2,
  Trash2,
  UserPlus,
  Plus,
  ListTodo,
  CheckCircle2,
  Circle,
  Calendar,
  Search,
  ArrowLeft,
  Mail,
  Send,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import { projectService } from '../services/project.service';
import { workspaceService } from '../../workspaces/services/workspace.service';
import { boardService } from '../../boards/services/board.service';
import { taskService } from '../../tasks/services/task.service';
import {
  Project,
  ProjectOverview,
  ProjectMember,
  ProjectRole,
  ProjectStatus,
  PriorityLevel,
} from '../../../types/project.types';
import { Activity } from '../../../types/activity.types';
import { WorkspaceMember, WorkspaceInvitation } from '../../../types/workspace.types';
import { Board, BoardColumn } from '../../../types/board.types';
import { Task } from '../../../types/task.types';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Select } from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';
import { Avatar } from '../../../components/ui/Avatar';
import { Modal } from '../../../components/ui/Modal';
import { Tabs } from '../../../components/ui/Tabs';
import { KanbanBoard } from '../../boards/components/KanbanBoard';
import { CreateTaskModal } from '../../tasks/components/CreateTaskModal';
import { TaskDetailModal } from '../../tasks/components/TaskDetailModal';
import { getErrorMessage } from '../../../utils/error';

export const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'board';
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [overview, setOverview] = useState<ProjectOverview | null>(null);
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & Filter for List view
  const [listSearch, setListSearch] = useState('');
  const [listPriorityFilter, setListPriorityFilter] = useState('ALL');

  // Modals state
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [createTaskColumnId, setCreateTaskColumnId] = useState<string | undefined>();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);

  // Settings form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('ACTIVE');
  const [priority, setPriority] = useState<PriorityLevel>('MEDIUM');
  const [targetDate, setTargetDate] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Add Member Modal & Project Invitations
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<ProjectRole>('MEMBER');
  const [projectInvitations, setProjectInvitations] = useState<WorkspaceInvitation[]>([]);
  const [inviteModalTab, setInviteModalTab] = useState<'workspace' | 'email'>('workspace');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteEmailRole, setInviteEmailRole] = useState<ProjectRole>('MEMBER');
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [resendingInviteId, setResendingInviteId] = useState<string | null>(null);

  const loadProjectData = useCallback(async () => {
    if (!projectId) return;
    try {
      setIsLoading(true);
      const [proj, boardsData, tasksData, invData] = await Promise.all([
        projectService.getProject(projectId),
        boardService.getProjectBoards(projectId),
        taskService.getProjectTasks(projectId),
        projectService.getProjectInvitations(projectId).catch(() => []),
      ]);

      setProject(proj);
      setName(proj.name);
      setDescription(proj.description || '');
      setStatus(proj.status);
      setPriority(proj.priority);
      setTargetDate(proj.targetDate ? proj.targetDate.slice(0, 10) : '');
      setMembers(proj.members || []);
      setBoards(boardsData);
      setProjectInvitations(invData);
      const parsedTasks: Task[] = Array.isArray(tasksData)
        ? tasksData
        : (tasksData as any)?.items || [];
      setTasks(parsedTasks);

      // Load workspace members for the Add Member modal
      if (proj.workspaceId) {
        const wsMembers = await workspaceService.getMembers(proj.workspaceId);
        setWorkspaceMembers(wsMembers.items || []);
      }
    } catch {
      toast.error('Failed to load project details');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadProjectData();
  }, [loadProjectData]);

  // Load tab-specific data on tab switch
  useEffect(() => {
    if (!projectId) return;
    if (currentTab === 'overview') {
      projectService.getProjectOverview(projectId).then(setOverview).catch(() => {});
    } else if (currentTab === 'activity') {
      projectService.getProjectActivity(projectId).then(setActivities).catch(() => {});
    } else if (currentTab === 'list' || currentTab === 'board') {
      taskService
        .getProjectTasks(projectId)
        .then((res) => {
          const parsed = Array.isArray(res) ? res : (res as any)?.items || [];
          setTasks(parsed);
        })
        .catch(() => {});
    }
  }, [projectId, currentTab]);

  const handleTabChange = (tabId: string) => {
    setSearchParams({ tab: tabId });
  };

  const primaryBoard = boards[0] || null;
  const columns: BoardColumn[] = useMemo(() => {
    if (!primaryBoard?.columns) return [];
    return [...primaryBoard.columns].sort((a, b) => a.position - b.position);
  }, [primaryBoard]);

  // Toggle completion in list view
  const handleToggleTaskCompletion = async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    const completedCol = columns.find((c) => c.isCompletedColumn || c.name.toLowerCase().includes('done') || c.name.toLowerCase().includes('completed'));
    const defaultCol = columns.find((c) => !c.isCompletedColumn && !c.name.toLowerCase().includes('done')) || columns[0];

    const isCurrentlyCompleted = !!task.completedAt || task.boardColumnId === completedCol?.id;
    const targetColId = isCurrentlyCompleted ? defaultCol?.id : completedCol?.id;

    if (!targetColId) return;

    try {
      await taskService.moveTask(task.id, targetColId, 0);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? {
                ...t,
                boardColumnId: targetColId,
                completedAt: isCurrentlyCompleted ? null : new Date().toISOString(),
              }
            : t
        )
      );
      toast.success(isCurrentlyCompleted ? 'Task marked incomplete' : 'Task completed!');
    } catch {
      toast.error('Failed to update task status');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
    try {
      setIsSavingSettings(true);
      const updated = await projectService.updateProject(project.id, {
        name,
        description: description || undefined,
        status,
        priority,
        targetDate: targetDate ? new Date(targetDate).toISOString() : undefined,
      });
      setProject(updated);
      toast.success('Project settings updated');
    } catch {
      toast.error('Failed to update project settings');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;
    if (!confirm(`Are you sure you want to delete "${project.name}"? This will remove all tasks and boards.`)) {
      return;
    }
    try {
      await projectService.deleteProject(project.id);
      toast.success('Project deleted');
      navigate('/projects');
    } catch {
      toast.error('Failed to delete project');
    }
  };

  const handleAddMember = async () => {
    if (!project || !selectedUserId) return;
    try {
      await projectService.addProjectMember(project.id, selectedUserId, selectedRole);
      toast.success('Member assigned to project');
      setIsAddMemberOpen(false);
      loadProjectData();
    } catch {
      toast.error('Failed to add project member');
    }
  };

  const handleInviteByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !inviteEmail.trim()) return;
    try {
      setIsSendingInvite(true);
      const created = await projectService.inviteProjectMember(
        project.id,
        inviteEmail.trim(),
        inviteEmailRole
      );
      const inviteUrl = created?.token ? `${window.location.origin}/invitations/${created.token}` : null;
      toast.success(`Project invitation sent to ${inviteEmail}`, {
        description: `Invitation email dispatched! If not visible in Inbox, please check the Spam or Promotions folder.`,
        action: inviteUrl
          ? {
              label: 'Copy Link',
              onClick: () => {
                navigator.clipboard.writeText(inviteUrl);
                toast.success('Project invitation link copied to clipboard!');
              },
            }
          : undefined,
      });
      setInviteEmail('');
      setIsAddMemberOpen(false);
      const updatedInvs = await projectService.getProjectInvitations(project.id).catch(() => []);
      setProjectInvitations(updatedInvs);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to send project invitation'));
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleResendProjectInvite = async (invitationId: string, email: string) => {
    if (!project) return;
    try {
      setResendingInviteId(invitationId);
      const updated = await projectService.resendProjectInvitation(project.id, invitationId);
      toast.success(`Invitation email resent to ${email}!`, {
        description: 'A refreshed 7-day link was sent to their email.',
      });
      setProjectInvitations((prev) =>
        prev.map((i) => (i.id === invitationId ? updated : i))
      );
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to resend invitation email'));
    } finally {
      setResendingInviteId(null);
    }
  };

  const handleCancelProjectInvite = async (invitationId: string) => {
    if (!project) return;
    try {
      await projectService.cancelProjectInvitation(project.id, invitationId);
      toast.success('Project invitation revoked');
      setProjectInvitations((prev) => prev.filter((i) => i.id !== invitationId));
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to cancel project invitation'));
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!project) return;
    if (!confirm('Remove member from this project?')) return;
    try {
      await projectService.removeProjectMember(project.id, userId);
      setMembers((prev) => prev.filter((m) => m.userId !== userId));
      toast.success('Member removed');
    } catch {
      toast.error('Failed to remove member');
    }
  };

  const handleUpdateMemberRole = async (userId: string, newRole: ProjectRole) => {
    if (!project) return;
    try {
      await projectService.updateProjectMemberRole(project.id, userId, newRole);
      setMembers((prev) =>
        prev.map((m) => (m.userId === userId ? { ...m, role: newRole } : m))
      );
      toast.success('Member role updated');
    } catch {
      toast.error('Failed to update member role');
    }
  };

  const handleOpenCreateTask = (columnId?: string) => {
    setCreateTaskColumnId(columnId || columns[0]?.id);
    setIsCreateTaskOpen(true);
  };

  const handleOpenTaskDetail = (taskId: string) => {
    setSelectedTaskId(taskId);
    setIsTaskDetailOpen(true);
  };

  const getPriorityVariant = (pri: PriorityLevel) => {
    switch (pri) {
      case 'URGENT':
        return 'danger';
      case 'HIGH':
        return 'warning';
      case 'MEDIUM':
        return 'primary';
      default:
        return 'default';
    }
  };

  const getStatusVariant = (st: ProjectStatus) => {
    switch (st) {
      case 'ACTIVE':
        return 'success';
      case 'COMPLETED':
        return 'info';
      case 'ON_HOLD':
        return 'warning';
      case 'ARCHIVED':
        return 'default';
      default:
        return 'outline';
    }
  };

  if (isLoading || !project) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-2" />
        <span className="text-xs">Loading project workspace...</span>
      </div>
    );
  }

  const safeTasks: Task[] = Array.isArray(tasks) ? tasks : (tasks as any)?.items || [];

  const tabsList = [
    { id: 'board', label: 'Kanban Board', icon: <Kanban className="w-4 h-4" /> },
    { id: 'list', label: 'List View', icon: <ListTodo className="w-4 h-4" />, count: safeTasks.length },
    { id: 'overview', label: 'Overview', icon: <BarChart2 className="w-4 h-4" /> },
    { id: 'members', label: 'Members', icon: <Users className="w-4 h-4" />, count: (members || []).length },
    { id: 'activity', label: 'Activity', icon: <History className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  // Candidates for project member addition (workspace members not yet added)
  const availableUsers = (workspaceMembers || []).filter(
    (wm) => !(members || []).some((pm) => pm.userId === wm.userId)
  );

  // Filter tasks for the List view
  const filteredListTasks = safeTasks.filter((t) => {
    if (listPriorityFilter !== 'ALL' && t.priority !== listPriorityFilter) return false;
    if (listSearch.trim()) {
      const q = listSearch.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Project Header */}
      <div className="space-y-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link
            to="/projects"
            className="flex items-center gap-1 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Projects</span>
          </Link>
          <span>/</span>
          <span className="font-semibold text-slate-900 dark:text-white">{project.name}</span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {project.key}
              </span>
              <Badge variant={getStatusVariant(project.status)} size="sm">
                {project.status}
              </Badge>
              <Badge variant={getPriorityVariant(project.priority)} size="sm">
                {project.priority}
              </Badge>
              {project.targetDate && (
                <span className="flex items-center gap-1 text-[11px] text-slate-500 ml-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Due {new Date(project.targetDate).toLocaleDateString()}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {project.name}
            </h1>
            {project.description && (
              <p className="text-xs text-slate-500 mt-1 max-w-2xl">{project.description}</p>
            )}
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Teammate Avatars */}
            <div className="flex items-center gap-1.5">
              <div className="flex -space-x-1.5 overflow-hidden">
                {members.slice(0, 4).map((m) => (
                  <Avatar
                    key={m.id}
                    src={m.user?.avatarUrl}
                    name={m.user?.name}
                    size="xs"
                    className="ring-2 ring-white dark:ring-slate-900"
                  />
                ))}
              </div>
              {members.length > 4 && (
                <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
                  +{members.length - 4}
                </span>
              )}
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsAddMemberOpen(true)}
              leftIcon={<UserPlus className="w-3.5 h-3.5" />}
            >
              Assign
            </Button>

            <Button
              size="sm"
              variant="primary"
              onClick={() => handleOpenCreateTask()}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              New Task
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs tabs={tabsList} activeTab={currentTab} onChange={handleTabChange} />

      {/* TAB 1: KANBAN BOARD */}
      {currentTab === 'board' && (
        <KanbanBoard
          projectId={project.id}
          projectKey={project.key}
          projectMembers={members}
        />
      )}

      {/* TAB 2: STRUCTURED LIST VIEW */}
      {currentTab === 'list' && (
        <div className="space-y-4">
          {/* List Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex-1 max-w-md">
              <Input
                placeholder="Filter tasks in this project..."
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                startIcon={<Search className="w-4 h-4 text-slate-400" />}
              />
            </div>

            <div className="flex items-center gap-2">
              <div className="w-36">
                <Select
                  value={listPriorityFilter}
                  onChange={(e) => setListPriorityFilter(e.target.value)}
                  options={[
                    { value: 'ALL', label: 'All Priorities' },
                    { value: 'LOW', label: 'Low' },
                    { value: 'MEDIUM', label: 'Medium' },
                    { value: 'HIGH', label: 'High' },
                    { value: 'URGENT', label: 'Urgent' },
                  ]}
                />
              </div>

              <Button
                size="sm"
                variant="primary"
                onClick={() => handleOpenCreateTask()}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add Task
              </Button>
            </div>
          </div>

          {/* Grouped Columns List */}
          {columns.length === 0 ? (
            <div className="p-12 text-center text-slate-500 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40">
              <p className="text-sm font-semibold">No board columns configured for this project.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {columns.map((col) => {
                const columnTasks = filteredListTasks.filter(
                  (t) => (t.boardColumnId || t.columnId) === col.id
                );

                return (
                  <div
                    key={col.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-xs"
                  >
                    {/* Column Group Header */}
                    <div className="px-4 py-2.5 bg-slate-50/75 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: col.color || '#6366f1' }}
                        />
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                          {col.name}
                        </span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {columnTasks.length}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleOpenCreateTask(col.id)}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                        title={`Add task to ${col.name}`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Task Rows */}
                    {columnTasks.length === 0 ? (
                      <div className="px-4 py-3 text-xs text-slate-400 italic flex items-center justify-between">
                        <span>No tasks in {col.name.toLowerCase()}</span>
                        <button
                          type="button"
                          onClick={() => handleOpenCreateTask(col.id)}
                          className="text-primary-600 dark:text-primary-400 hover:underline text-[11px] not-italic font-medium"
                        >
                          + Add a task
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {columnTasks.map((t) => {
                          const isCompleted = !!t.completedAt || col.isCompletedColumn;

                          return (
                            <div
                              key={t.id}
                              onClick={() => handleOpenTaskDetail(t.id)}
                              className="group px-4 py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <button
                                  type="button"
                                  onClick={(e) => handleToggleTaskCompletion(t, e)}
                                  className="text-slate-400 hover:text-emerald-500 transition-colors shrink-0"
                                >
                                  {isCompleted ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-50 dark:fill-emerald-950" />
                                  ) : (
                                    <Circle className="w-4 h-4 text-slate-300 hover:text-slate-500" />
                                  )}
                                </button>

                                <div className="min-w-0">
                                  <span
                                    className={`text-xs font-semibold block truncate ${
                                      isCompleted
                                        ? 'line-through text-slate-400 dark:text-slate-500'
                                        : 'text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors'
                                    }`}
                                  >
                                    {t.title}
                                  </span>
                                  {t.description && (
                                    <p className="text-[11px] text-slate-500 truncate max-w-md">
                                      {t.description}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-3 shrink-0">
                                <Badge variant={getPriorityVariant(t.priority)} size="sm">
                                  {t.priority}
                                </Badge>

                                {t.dueDate && (
                                  <span className="flex items-center gap-1 text-[11px] text-slate-500">
                                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                    {new Date(t.dueDate).toLocaleDateString()}
                                  </span>
                                )}

                                <div className="flex -space-x-1.5 overflow-hidden">
                                  {(t.assignees || []).map((a) => (
                                    <Avatar
                                      key={a.id}
                                      src={a.user?.avatarUrl}
                                      name={a.user?.name}
                                      size="xs"
                                      className="ring-2 ring-white dark:ring-slate-900"
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: OVERVIEW */}
      {currentTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <span className="text-xs text-slate-500">Total Deliverables</span>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {overview?.totalTasks ?? safeTasks.length}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <span className="text-xs text-slate-500">Completed Tasks</span>
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  {overview?.completedTasks ?? 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <span className="text-xs text-slate-500">Pending Execution</span>
                <p className="text-2xl font-bold text-primary-600 mt-1">
                  {overview?.pendingTasks ?? 0}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <span className="text-xs text-slate-500">Overdue Alerts</span>
                <p className="text-2xl font-bold text-rose-600 mt-1">
                  {overview?.overdueTasks ?? 0}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Sprint Completion Rate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span>Progress Percentage</span>
                <span className="text-primary-600">{overview?.completionPercentage ?? 0}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-primary-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${overview?.completionPercentage ?? 0}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 4: MEMBERS */}
      {currentTab === 'members' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Project Members ({members.length})</CardTitle>
                <p className="text-xs text-slate-500 mt-1">
                  Teammates actively collaborating on this project.
                </p>
              </div>
              <Button
                size="sm"
                onClick={() => setIsAddMemberOpen(true)}
                leftIcon={<UserPlus className="w-3.5 h-3.5" />}
              >
                Add or Invite Member
              </Button>
            </CardHeader>
            <CardContent className="divide-y divide-slate-100 dark:divide-slate-800">
              {members.map((member) => (
                <div key={member.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar src={member.user?.avatarUrl} name={member.user?.name} size="md" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {member.user?.name}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{member.user?.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={member.role}
                      onChange={(e) => handleUpdateMemberRole(member.userId, e.target.value as ProjectRole)}
                      className="text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 focus:ring-1 focus:ring-primary-500"
                    >
                      <option value="MANAGER">Manager</option>
                      <option value="MEMBER">Member</option>
                      <option value="VIEWER">Viewer</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => handleRemoveMember(member.userId)}
                      className="p-1.5 rounded-md text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      title="Remove from project"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Pending Project Invitations */}
          {projectInvitations.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary-600" />
                  <CardTitle className="text-sm">
                    Pending Project Invitations ({projectInvitations.length})
                  </CardTitle>
                </div>
                <p className="text-xs text-slate-500">
                  Invited collaborators who haven't accepted their project invite yet.
                </p>
              </CardHeader>
              <CardContent className="divide-y divide-slate-100 dark:divide-slate-800">
                {projectInvitations.map((inv) => (
                  <div key={inv.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                        {inv.email}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                        <span>Role: <strong className="text-slate-600 dark:text-slate-300">{inv.projectRole || 'MEMBER'}</strong></span>
                        <span>•</span>
                        <span>Expires {new Date(inv.expiresAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResendProjectInvite(inv.id, inv.email)}
                        isLoading={resendingInviteId === inv.id}
                        className="text-xs gap-1.5 text-primary-600 hover:text-primary-700 hover:bg-primary-50 dark:hover:bg-primary-950"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Resend
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const url = `${window.location.origin}/invitations/${inv.token}`;
                          navigator.clipboard.writeText(url);
                          toast.success(`Project invitation link for ${inv.email} copied!`);
                        }}
                        className="text-xs gap-1.5"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Copy Link
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelProjectInvite(inv.id)}
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950 text-xs"
                      >
                        Revoke
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* TAB 5: ACTIVITY */}
      {currentTab === 'activity' && (
        <Card>
          <CardHeader>
            <CardTitle>Project Activity Log</CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                No activity recorded yet for this project.
              </p>
            ) : (
              <div className="space-y-4">
                {activities.map((act) => (
                  <div key={act.id} className="flex items-start gap-3 text-xs">
                    <Avatar src={act.user?.avatarUrl} name={act.user?.name} size="xs" />
                    <div>
                      <p className="text-slate-800 dark:text-slate-200">
                        <span className="font-semibold">{act.user?.name || 'User'}</span>{' '}
                        <span className="text-slate-500">{act.action.toLowerCase()}</span>{' '}
                        {act.task && <span className="font-medium text-primary-600">[{act.task.title}]</span>}
                      </p>
                      <span className="text-[10px] text-slate-400">
                        {new Date(act.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TAB 6: SETTINGS */}
      {currentTab === 'settings' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveSettings} className="space-y-4 max-w-lg">
                <Input
                  label="Project Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />

                <Input
                  label="Project Key"
                  value={project.key}
                  disabled
                  helperText="Project key identifier cannot be modified."
                />

                <Textarea
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />

                <div className="grid grid-cols-2 gap-4">
                  <Select
                    label="Status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                    options={[
                      { value: 'PLANNING', label: 'Planning' },
                      { value: 'ACTIVE', label: 'Active' },
                      { value: 'ON_HOLD', label: 'On Hold' },
                      { value: 'COMPLETED', label: 'Completed' },
                      { value: 'ARCHIVED', label: 'Archived' },
                    ]}
                  />

                  <Select
                    label="Priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                    options={[
                      { value: 'LOW', label: 'Low' },
                      { value: 'MEDIUM', label: 'Medium' },
                      { value: 'HIGH', label: 'High' },
                      { value: 'URGENT', label: 'Urgent' },
                    ]}
                  />
                </div>

                <Input
                  label="Target Completion Date"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                />

                <div className="pt-2">
                  <Button type="submit" isLoading={isSavingSettings}>
                    Save Project Settings
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Delete Danger Zone */}
          <Card className="border-rose-200 dark:border-rose-900/60 bg-rose-50/20 dark:bg-rose-950/20">
            <CardHeader>
              <CardTitle className="text-rose-600 dark:text-rose-400">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                    Delete Project
                  </h4>
                  <p className="text-xs text-slate-500">
                    Permanently delete this project and all associated Kanban boards, columns, and tasks.
                  </p>
                </div>
                <Button variant="danger" size="sm" onClick={handleDeleteProject}>
                  Delete Project
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Task Creation Modal */}
      {isCreateTaskOpen && (
        <CreateTaskModal
          isOpen={isCreateTaskOpen}
          onClose={() => setIsCreateTaskOpen(false)}
          projectId={project.id}
          columns={columns}
          defaultColumnId={createTaskColumnId}
          projectMembers={members}
          onCreated={loadProjectData}
        />
      )}

      {/* Task Detail Modal */}
      {isTaskDetailOpen && (
        <TaskDetailModal
          taskId={selectedTaskId}
          isOpen={isTaskDetailOpen}
          onClose={() => {
            setIsTaskDetailOpen(false);
            setSelectedTaskId(null);
          }}
          columns={columns}
          projectMembers={members}
          onTaskUpdated={loadProjectData}
          onTaskDeleted={loadProjectData}
        />
      )}

      {/* Add / Invite Project Member Modal */}
      <Modal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        title="Add Project Member"
        description={`Add a teammate or invite an external collaborator to "${project?.name}".`}
      >
        <div className="space-y-4 pt-2">
          {/* Tabs: Workspace vs Email */}
          <div className="flex border-b border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setInviteModalTab('workspace')}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
                inviteModalTab === 'workspace'
                  ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Workspace Member
            </button>
            <button
              type="button"
              onClick={() => setInviteModalTab('email')}
              className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors ${
                inviteModalTab === 'email'
                  ? 'border-primary-600 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Invite by Email (Single Project)
            </button>
          </div>

          {inviteModalTab === 'workspace' ? (
            <div className="space-y-4 pt-1">
              {availableUsers.length === 0 ? (
                <div className="py-6 text-center space-y-3">
                  <p className="text-xs text-slate-500">
                    All existing workspace members are already assigned to this project.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInviteModalTab('email')}
                  >
                    Invite New Collaborator by Email
                  </Button>
                </div>
              ) : (
                <>
                  <Select
                    label="Select Teammate"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                  >
                    <option value="">Choose a team member...</option>
                    {availableUsers.map((wm) => (
                      <option key={wm.userId} value={wm.userId}>
                        {wm.user?.name} ({wm.user?.email})
                      </option>
                    ))}
                  </Select>

                  <Select
                    label="Project Role"
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as ProjectRole)}
                    options={[
                      { value: 'MEMBER', label: 'Member — Create, edit, and move tasks' },
                      { value: 'MANAGER', label: 'Manager — Manage boards, columns, and members' },
                      { value: 'VIEWER', label: 'Viewer — Read-only observation' },
                    ]}
                  />

                  <div className="flex justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={() => setIsAddMemberOpen(false)}>
                      Cancel
                    </Button>
                    <Button disabled={!selectedUserId} onClick={handleAddMember}>
                      Assign to Project
                    </Button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <form onSubmit={handleInviteByEmail} className="space-y-4 pt-1">
              <Input
                label="Collaborator Email"
                type="email"
                placeholder="contractor@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />

              <Select
                label="Project Role"
                value={inviteEmailRole}
                onChange={(e) => setInviteEmailRole(e.target.value as ProjectRole)}
                options={[
                  { value: 'MEMBER', label: 'Member — Create and move tasks on this board' },
                  { value: 'MANAGER', label: 'Manager — Manage this project board & tasks' },
                  { value: 'VIEWER', label: 'Viewer — Read-only client/stakeholder access' },
                ]}
              />

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-[11px] text-slate-500 leading-relaxed">
                🔒 <strong>Single-Project Access:</strong> This user will only be able to view and collaborate on this project (<strong>{project?.name}</strong>). Other workspace projects will remain hidden and inaccessible.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" type="button" onClick={() => setIsAddMemberOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" isLoading={isSendingInvite} disabled={!inviteEmail.trim()}>
                  Send Project Invite
                </Button>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ProjectDetailPage;
