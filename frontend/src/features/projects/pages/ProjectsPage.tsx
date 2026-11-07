import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Kanban,
  CheckSquare,
  Calendar,
  Loader2,
  FolderPlus,
  List as ListIcon,
  LayoutGrid,
  ChevronRight,
  FolderKanban,
  Layers,
} from 'lucide-react';
import { useWorkspaceStore } from '../../../stores/workspace-store';
import { projectService } from '../services/project.service';
import { Project, ProjectStatus, PriorityLevel } from '../../../types/project.types';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';
import { Avatar } from '../../../components/ui/Avatar';
import { EmptyState } from '../../../components/ui/EmptyState';
import { CreateProjectModal } from '../components/CreateProjectModal';

type ViewMode = 'table' | 'grid';

export const ProjectsPage: React.FC = () => {
  const { currentWorkspace } = useWorkspaceStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isCreateOpen, setIsCreateOpen] = useState(searchParams.get('create') === 'true');
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const navigate = useNavigate();

  const loadProjects = useCallback(async () => {
    if (!currentWorkspace) return;
    try {
      setIsLoading(true);
      const params: { status?: ProjectStatus; priority?: PriorityLevel } = {};
      if (statusFilter !== 'ALL') params.status = statusFilter as ProjectStatus;
      if (priorityFilter !== 'ALL') params.priority = priorityFilter as PriorityLevel;

      const data = await projectService.getWorkspaceProjects(currentWorkspace.id, params);
      setProjects(data);
    } catch {
      // Handled gracefully
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace, statusFilter, priorityFilter]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleOpenCreate = () => {
    setIsCreateOpen(true);
    setSearchParams({ create: 'true' });
  };

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
    setSearchParams({});
  };

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.key.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.creator?.name && p.creator.name.toLowerCase().includes(q)) ||
        (p.creator?.email && p.creator.email.toLowerCase().includes(q))
      );
    });
  }, [projects, searchQuery]);

  // Project statistics
  const stats = useMemo(() => {
    const total = projects.length;
    const active = projects.filter((p) => p.status === 'ACTIVE').length;
    const planning = projects.filter((p) => p.status === 'PLANNING').length;
    const completed = projects.filter((p) => p.status === 'COMPLETED').length;
    return { total, active, planning, completed };
  }, [projects]);

  const getPriorityVariant = (priority: PriorityLevel) => {
    switch (priority) {
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

  const getStatusVariant = (status: ProjectStatus) => {
    switch (status) {
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

  if (!currentWorkspace) {
    return (
      <EmptyState
        title="No active workspace selected"
        description="Select or create a workspace to view and manage your projects."
        actionLabel="Go to Workspaces"
        onAction={() => navigate('/workspaces')}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Projects
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {projects.length}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Workspace deliverables in <span className="font-semibold text-slate-800 dark:text-slate-200">{currentWorkspace.name}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleOpenCreate} leftIcon={<Plus className="w-4 h-4" />}>
            New Project
          </Button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">All Projects</span>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300">
            <FolderKanban className="w-4 h-4" />
          </div>
        </div>

        <div className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Active</span>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.active}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Layers className="w-4 h-4" />
          </div>
        </div>

        <div className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Planning</span>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.planning}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Kanban className="w-4 h-4" />
          </div>
        </div>

        <div className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wider">Completed</span>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{stats.completed}</p>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <CheckSquare className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Filters & View Toggle */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex-1 min-w-[240px] max-w-md">
          <Input
            placeholder="Search by project name, key, owner, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            startIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <div className="w-36">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Statuses' },
                { value: 'PLANNING', label: 'Planning' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'ON_HOLD', label: 'On Hold' },
                { value: 'COMPLETED', label: 'Completed' },
                { value: 'ARCHIVED', label: 'Archived' },
              ]}
            />
          </div>

          <div className="w-36">
            <Select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              options={[
                { value: 'ALL', label: 'All Priorities' },
                { value: 'LOW', label: 'Low' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'HIGH', label: 'High' },
                { value: 'URGENT', label: 'Urgent' },
              ]}
            />
          </div>

          {/* View mode toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
              title="Table View"
            >
              <ListIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md text-xs font-medium transition-all ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-2" />
          <span className="text-xs">Loading projects...</span>
        </div>
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          icon={<FolderPlus className="w-6 h-6" />}
          title={searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL' ? 'No matching projects found' : 'No projects yet'}
          description={
            searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL'
              ? 'Try modifying your search or clearing active filters.'
              : 'Create your first project with a default Kanban board to organize team tasks and milestones.'
          }
          actionLabel={searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL' ? undefined : 'Create Project'}
          onAction={searchQuery || statusFilter !== 'ALL' || priorityFilter !== 'ALL' ? undefined : handleOpenCreate}
        />
      ) : viewMode === 'table' ? (
        /* STRUCTURED TABLE / LIST VIEW */
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Project</th>
                  <th className="py-3 px-4">Owner / Lead</th>
                  <th className="py-3 px-4">Team</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Tasks</th>
                  <th className="py-3 px-4">Target Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                {filteredProjects.map((project) => {
                  const taskCount = project._count?.tasks ?? 0;
                  const memberCount = (project.members?.length || project._count?.members) ?? 1;

                  return (
                    <tr
                      key={project.id}
                      onClick={() => navigate(`/projects/${project.id}`)}
                      className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                    >
                      {/* Project Name & Key */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 shrink-0 border border-slate-200 dark:border-slate-700">
                            {project.key}
                          </span>
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate block">
                              {project.name}
                            </span>
                            {project.description && (
                              <p className="text-[11px] text-slate-500 truncate max-w-xs mt-0.5">
                                {project.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Owner */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Avatar
                            src={project.creator?.avatarUrl}
                            name={project.creator?.name || 'Owner'}
                            size="xs"
                          />
                          <span className="text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                            {project.creator?.name || 'Workspace Admin'}
                          </span>
                        </div>
                      </td>

                      {/* Team Members */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <div className="flex -space-x-1.5 overflow-hidden">
                            {(project.members || []).slice(0, 3).map((m) => (
                              <Avatar
                                key={m.id}
                                src={m.user?.avatarUrl}
                                name={m.user?.name}
                                size="xs"
                                className="ring-2 ring-white dark:ring-slate-900"
                              />
                            ))}
                          </div>
                          {memberCount > 3 && (
                            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
                              +{memberCount - 3}
                            </span>
                          )}
                          <span className="text-slate-500 text-[11px] ml-1">
                            {memberCount} {memberCount === 1 ? 'member' : 'members'}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Badge variant={getStatusVariant(project.status)} size="sm">
                          {project.status}
                        </Badge>
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Badge variant={getPriorityVariant(project.priority)} size="sm">
                          {project.priority}
                        </Badge>
                      </td>

                      {/* Tasks count & progress */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <CheckSquare className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
                          </span>
                        </div>
                      </td>

                      {/* Target Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {project.targetDate ? (
                          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{new Date(project.targetDate).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* Quick Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Link to={`/projects/${project.id}`}>
                            <Button variant="outline" size="sm" leftIcon={<Kanban className="w-3.5 h-3.5 text-primary-600" />}>
                              Board
                            </Button>
                          </Link>
                          <Link to={`/projects/${project.id}?tab=overview`}>
                            <Button variant="ghost" size="sm" className="px-2">
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* COMPACT GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => {
            const taskCount = project._count?.tasks ?? 0;
            const memberCount = (project.members?.length || project._count?.members) ?? 1;

            return (
              <div
                key={project.id}
                onClick={() => navigate(`/projects/${project.id}`)}
                className="group p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer flex flex-col justify-between shadow-xs hover:shadow-sm"
              >
                <div>
                  {/* Top Key & Badges */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {project.key}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Badge variant={getStatusVariant(project.status)} size="sm">
                        {project.status}
                      </Badge>
                      <Badge variant={getPriorityVariant(project.priority)} size="sm">
                        {project.priority}
                      </Badge>
                    </div>
                  </div>

                  {/* Project Name & Description */}
                  <h3 className="font-semibold text-base text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-1">
                    {project.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-[32px]">
                    {project.description || 'No description provided.'}
                  </p>
                </div>

                {/* Card Meta & Actions */}
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <CheckSquare className="w-3.5 h-3.5 text-primary-500" />
                      {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
                    </span>
                    {project.targetDate && (
                      <span className="flex items-center gap-1.5 text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(project.targetDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-1" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5">
                      <div className="flex -space-x-1.5 overflow-hidden">
                        {(project.members || []).slice(0, 3).map((m) => (
                          <Avatar
                            key={m.id}
                            src={m.user?.avatarUrl}
                            name={m.user?.name}
                            size="xs"
                            className="ring-2 ring-white dark:ring-slate-900"
                          />
                        ))}
                      </div>
                      {memberCount > 3 && (
                        <span className="text-[10px] font-semibold text-slate-500">
                          +{memberCount - 3}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Link to={`/projects/${project.id}`}>
                        <Button variant="primary" size="sm" leftIcon={<Kanban className="w-3.5 h-3.5" />}>
                          Workspace
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateOpen}
        onClose={handleCloseCreate}
        onCreated={loadProjects}
      />
    </div>
  );
};

export default ProjectsPage;
