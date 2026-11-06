import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Building2, User, Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { workspaceService } from '../../workspaces/services/workspace.service';
import { WorkspaceInvitation } from '../../../types/workspace.types';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';

export const AcceptInvitationPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [invitation, setInvitation] = useState<WorkspaceInvitation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;
    const fetchInvite = async () => {
      try {
        const details = await workspaceService.getInvitationDetails(token);
        setInvitation(details);
      } catch {
        toast.error('Invitation is invalid or has expired.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchInvite();
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    try {
      setIsProcessing(true);
      await workspaceService.acceptInvitation(token);
      toast.success('Invitation accepted! Welcome to the workspace.');
      navigate('/dashboard');
    } catch {
      toast.error('Failed to accept invitation.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!token) return;
    try {
      setIsProcessing(true);
      await workspaceService.rejectInvitation(token);
      toast.info('Invitation declined.');
      navigate('/');
    } catch {
      toast.error('Failed to decline invitation.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <Card className="max-w-md w-full text-center p-6">
          <CardTitle>Invitation Expired or Invalid</CardTitle>
          <p className="text-xs text-slate-500 mt-2">
            This invitation link is no longer valid. Please request a new invitation from your workspace admin.
          </p>
          <div className="mt-6">
            <Button onClick={() => navigate('/')}>Return Home</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center pb-2">
          <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center mx-auto mb-3 dark:bg-primary-950/60 dark:text-primary-400">
            <Building2 className="w-6 h-6" />
          </div>
          <CardTitle className="text-xl">Join Workspace</CardTitle>
          <p className="text-xs text-slate-500 mt-1">
            You have been invited to collaborate on TeamFlow
          </p>
        </CardHeader>

        <CardContent className="space-y-6 pt-4">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-200/80 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Workspace</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {invitation.workspace?.name || 'Team Workspace'}
              </span>
            </div>

            {invitation.invitedBy && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Invited By</span>
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {invitation.invitedBy.name}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Role Granted</span>
              <Badge variant="primary" size="sm">
                {invitation.role}
              </Badge>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button
              className="w-full"
              isLoading={isProcessing}
              onClick={handleAccept}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Accept & Join Workspace
            </Button>
            <Button
              variant="outline"
              className="w-full"
              disabled={isProcessing}
              onClick={handleDecline}
            >
              Decline
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvitationPage;
