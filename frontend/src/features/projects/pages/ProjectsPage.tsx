import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Kanban,
  CheckSquare,
  Users,
  Calendar,
  Loader2,
  FolderPlus,
} from 'lucide-react';
import { useWorkspaceStore } from '../../../stores/workspace-store';
import { projectService } from '../services/project.service';
import { Project, ProjectStatus, PriorityLevel } from '../../../types/project.types';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { CreateProjectModal } from '../components/CreateProjectModal';

export const ProjectsPage: React.FC = () => {
  const { currentWorkspace } = useWorkspaceStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isCreateOpen, setIsCreateOpen] = useState(searchParams.get('create') === 'true');
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
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
      // Handled silently
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

  const filteredProjects = projects.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.key.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  });

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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Projects
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Projects in <span className="font-semibold text-slate-800 dark:text-slate-200">{currentWorkspace.name}</span>
          </p>
        </div>

        <Button size="sm" onClick={handleOpenCreate} leftIcon={<Plus className="w-4 h-4" />}>
          New Project
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1">
          <Input
            placeholder="Search projects by name, key, or details..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            startIcon={<Search className="w-4 h-4" />}
          />
        </div>

        <div className="flex items-center gap-2">
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
        </div>
      </div>

      {/* Projects Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 text-slate-500">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-2" />
          <span className="text-xs">Loading projects...</span>
        </div>
      ) : filteredProjects.length === 0 ? (
        <EmptyState
          icon={<FolderPlus className="w-6 h-6" />}
          title={searchQuery ? 'No matching projects found' : 'No projects yet'}
          description={
            searchQuery
              ? 'Try modifying your search or filters.'
              : 'Create your first project with a default Kanban board to start organizing team deliverables.'
          }
          actionLabel={searchQuery ? undefined : 'Create Project'}
          onAction={searchQuery ? undefined : handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
              hoverable
              className="flex flex-col justify-between"
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-block font-mono text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 mb-1.5">
                      {project.key}
                    </span>
                    <CardTitle className="text-base line-clamp-1">{project.name}</CardTitle>
                  </div>

                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <Badge variant={getStatusVariant(project.status)} size="sm">
                      {project.status}
                    </Badge>
                    <Badge variant={getPriorityVariant(project.priority)} size="sm">
                      {project.priority}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 min-h-[32px]">
                  {project.description || 'No description provided.'}
                </p>

                <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="flex items-center gap-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-primary-500" />
                    {project._count?.tasks ?? 0} Tasks
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-500" />
                    {project._count?.members ?? 1} Members
                  </span>
                  {project.targetDate && (
                    <span className="flex items-center gap-1.5 ml-auto text-[11px]">
                      <Calendar className="w-3.5 h-3.5 text-amber-500" />
                      {new Date(project.targetDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </CardContent>

              <CardFooter className="justify-between">
                <Link to={`/projects/${project.id}`}>
                  <Button variant="primary" size="sm" leftIcon={<Kanban className="w-3.5 h-3.5" />}>
                    Open Board
                  </Button>
                </Link>

                <Link to={`/projects/${project.id}?tab=overview`}>
                  <Button variant="ghost" size="sm">
                    Overview
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Modal */}
      <CreateProjectModal
        isOpen={isCreateOpen}
        onClose={handleCloseCreate}
        onCreated={loadProjects}
      />
    </div>
  );
};

export default ProjectsPage;
