import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Users, FolderGit2, Check, ArrowRight, Shield } from 'lucide-react';
import { useWorkspaceStore } from '../../../stores/workspace-store';
import { useAuthStore } from '../../../stores/auth-store';
import { Button } from '../../../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { CreateWorkspaceModal } from '../components/CreateWorkspaceModal';

export const WorkspacesPage: React.FC = () => {
  const { workspaces, currentWorkspace, setCurrentWorkspace } = useWorkspaceStore();
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isCreateOpen, setIsCreateOpen] = useState(searchParams.get('create') === 'true');
  const navigate = useNavigate();

  const handleSelectWorkspace = (ws: (typeof workspaces)[0]) => {
    setCurrentWorkspace(ws);
  };

  const handleOpenCreate = () => {
    setIsCreateOpen(true);
    setSearchParams({ create: 'true' });
  };

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
    setSearchParams({});
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Workspaces
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Organize multi-tenant teams, permissions, and departmental projects.
          </p>
        </div>

        <Button size="sm" onClick={handleOpenCreate} leftIcon={<Plus className="w-4 h-4" />}>
          Create Workspace
        </Button>
      </div>

      {/* Workspace Grid */}
      {workspaces.length === 0 ? (
        <EmptyState
          title="No workspaces found"
          description="Create your first team workspace to start adding projects and collaborating."
          actionLabel="Create Workspace"
          onAction={handleOpenCreate}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map((ws) => {
            const isCurrent = currentWorkspace?.id === ws.id;
            const isOwner = ws.ownerId === user?.id;

            return (
              <Card
                key={ws.id}
                hoverable
                className={`flex flex-col justify-between ${
                  isCurrent ? 'ring-2 ring-primary-500 border-transparent' : ''
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                        {ws.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <CardTitle className="text-base">{ws.name}</CardTitle>
                        <p className="text-[11px] font-mono text-slate-400">/{ws.slug}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isOwner && (
                        <Badge variant="outline" size="sm">
                          <Shield className="w-3 h-3 mr-1 text-primary-500" />
                          Owner
                        </Badge>
                      )}
                      {isCurrent && (
                        <Badge variant="success" size="sm">
                          <Check className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 min-h-[32px]">
                    {ws.description || 'No description provided.'}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="flex items-center gap-1.5">
                      <FolderGit2 className="w-3.5 h-3.5 text-primary-500" />
                      {ws._count?.projects ?? 0} Projects
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-500" />
                      {ws._count?.members ?? 1} Members
                    </span>
                  </div>
                </CardContent>

                <CardFooter className="justify-between">
                  <Button
                    variant={isCurrent ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handleSelectWorkspace(ws)}
                  >
                    {isCurrent ? 'Current Workspace' : 'Select'}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCurrentWorkspace(ws);
                      navigate(`/workspaces/${ws.id}`);
                    }}
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    Manage
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <CreateWorkspaceModal isOpen={isCreateOpen} onClose={handleCloseCreate} />
    </div>
  );
};

export default WorkspacesPage;
