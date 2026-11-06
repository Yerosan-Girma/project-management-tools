import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Kanban,
  BarChart2,
  Users,
  History,
  Settings,
  Loader2,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { toast } from 'sonner';
import { projectService } from '../services/project.service';
import { workspaceService } from '../../workspaces/services/workspace.service';
import {
  Project,
  ProjectOverview,
  ProjectMember,
  ProjectRole,
  ProjectStatus,
  PriorityLevel,
} from '../../../types/project.types';
import { Activity } from '../../../types/activity.types';
import { WorkspaceMember } from '../../../types/workspace.types';
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
  const [isLoading, setIsLoading] = useState(true);

  // Settings form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('ACTIVE');
  const [priority, setPriority] = useState<PriorityLevel>('MEDIUM');
  const [targetDate, setTargetDate] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Add Member Modal
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState<ProjectRole>('MEMBER');

  const loadProject = useCallback(async () => {
    if (!projectId) return;
    try {
      setIsLoading(true);
      const proj = await projectService.getProject(projectId);
      setProject(proj);
      setName(proj.name);
      setDescription(proj.description || '');
      setStatus(proj.status);
      setPriority(proj.priority);
      setTargetDate(proj.targetDate ? proj.targetDate.slice(0, 10) : '');
      setMembers(proj.members || []);

      // If workspace id is present, load workspace members for addition
      if (proj.workspaceId) {
        const wsMembers = await workspaceService.getMembers(proj.workspaceId);
        setWorkspaceMembers(wsMembers.items || []);
      }
    } catch {
      toast.error('Failed to load project');
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  // Load tab-specific data on tab switch
  useEffect(() => {
    if (!projectId) return;
    if (currentTab === 'overview') {
      projectService.getProjectOverview(projectId).then(setOverview).catch(() => {});
    } else if (currentTab === 'activity') {
      projectService.getProjectActivity(projectId).then(setActivities).catch(() => {});
    }
  }, [projectId, currentTab]);

  const handleTabChange = (tabId: string) => {
    setSearchParams({ tab: tabId });
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
      loadProject();
    } catch {
      toast.error('Failed to add project member');
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

  if (isLoading || !project) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-2" />
        <span className="text-xs">Loading project details...</span>
      </div>
    );
  }

  const tabsList = [
    { id: 'board', label: 'Kanban Board', icon: <Kanban className="w-4 h-4" /> },
    { id: 'overview', label: 'Overview', icon: <BarChart2 className="w-4 h-4" /> },
    { id: 'members', label: 'Members', icon: <Users className="w-4 h-4" />, count: members.length },
    { id: 'activity', label: 'Activity', icon: <History className="w-4 h-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
  ];

  // Candidates for project member addition (workspace members not yet added)
  const availableUsers = workspaceMembers.filter(
    (wm) => !members.some((pm) => pm.userId === wm.userId)
  );

  return (
    <div className="space-y-6">
      {/* Project Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-primary-50 text-primary-700 dark:bg-primary-950/60 dark:text-primary-300">
              {project.key}
            </span>
            <Badge variant="outline" size="sm">
              {project.status}
            </Badge>
            <Badge variant="primary" size="sm">
              {project.priority}
            </Badge>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {project.name}
          </h1>
          {project.description && (
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{project.description}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {members.slice(0, 4).map((m) => (
              <Avatar
                key={m.id}
                src={m.user?.avatarUrl}
                name={m.user?.name}
                size="sm"
                className="ring-2 ring-white dark:ring-slate-900"
              />
            ))}
            {members.length > 4 && (
              <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 text-xs font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                +{members.length - 4}
              </div>
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
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs tabs={tabsList} activeTab={currentTab} onChange={handleTabChange} />

      {/* Tab 1: Board View */}
      {currentTab === 'board' && (
        <KanbanBoard
          projectId={project.id}
          projectKey={project.key}
          projectMembers={members}
        />
      )}

      {/* Tab 2: Overview */}
      {currentTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-4">
                <span className="text-xs text-slate-500">Total Deliverables</span>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {overview?.totalTasks ?? 0}
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

      {/* Tab 3: Members */}
      {currentTab === 'members' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Project Members ({members.length})</CardTitle>
            <Button
              size="sm"
              onClick={() => setIsAddMemberOpen(true)}
              leftIcon={<UserPlus className="w-3.5 h-3.5" />}
            >
              Add Project Member
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
      )}

      {/* Tab 4: Activity */}
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

      {/* Tab 5: Settings */}
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

      {/* Add Project Member Modal */}
      <Modal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        title="Assign Member to Project"
        description="Select a teammate from this workspace to assign to the project."
      >
        <div className="space-y-4 pt-2">
          {availableUsers.length === 0 ? (
            <p className="text-xs text-slate-500">
              All workspace members have already been added to this project.
            </p>
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
                  { value: 'MEMBER', label: 'Member — Create and move tasks' },
                  { value: 'MANAGER', label: 'Manager — Manage boards and members' },
                  { value: 'VIEWER', label: 'Viewer — Read-only observation' },
                ]}
              />

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setIsAddMemberOpen(false)}>
                  Cancel
                </Button>
                <Button disabled={!selectedUserId} onClick={handleAddMember}>
                  Assign Member
                </Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ProjectDetailPage;
