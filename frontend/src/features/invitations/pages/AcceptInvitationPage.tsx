import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Building2,
  User as UserIcon,
  Loader2,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  LogIn,
  UserPlus,
  LogOut,
  Lock,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { workspaceService } from '../../workspaces/services/workspace.service';
import { authService } from '../../auth/services/auth.service';
import { WorkspaceInvitation } from '../../../types/workspace.types';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { useAuthStore } from '../../../stores/auth-store';
import { useWorkspaceStore } from '../../../stores/workspace-store';

export const AcceptInvitationPage: React.FC = () => {
  const { token: paramToken } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const token = (paramToken && paramToken !== 'accept' ? paramToken : '') || searchParams.get('token') || '';

  const [invitation, setInvitation] = useState<WorkspaceInvitation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // In-page form state for zero-redirect onboarding
  const [authMode, setAuthMode] = useState<'REGISTER' | 'LOGIN'>('REGISTER');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { user, isAuthenticated, setAuth, logout } = useAuthStore();
  const { setCurrentWorkspace, addWorkspace } = useWorkspaceStore();

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }
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

  // Navigate to Dashboard with proper active workspace context
  const activateWorkspaceAndGo = (ws: any, roleName: string) => {
    if (ws) {
      setCurrentWorkspace(ws);
      addWorkspace(ws);
      localStorage.setItem('teamflow_active_workspace_id', ws.id);
    }
    toast.success(`Welcome to ${ws?.name || 'the workspace'}! You have joined as ${roleName}.`);
    navigate('/dashboard', { replace: true });
  };

  // 1. One-click Accept when already logged in with matching email
  const handleDirectAccept = async () => {
    if (!token) return;
    try {
      setIsProcessing(true);
      const result = await workspaceService.acceptInvitation(token);
      const ws = result?.workspace || invitation?.workspace;
      activateWorkspaceAndGo(ws, invitation?.role || 'member');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to accept invitation.';
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. In-Page Account Creation & Join (No redirect)
  const handleInPageRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !invitation) return;

    if (!name.trim()) {
      setFormError('Please enter your full name.');
      return;
    }
    if (password.length < 8) {
      setFormError('Password must be at least 8 characters long.');
      return;
    }

    try {
      setIsProcessing(true);
      setFormError(null);

      const result = await authService.register({
        name: name.trim(),
        email: invitation.email,
        password,
        inviteToken: token,
      });

      setAuth(result.user, result.tokens);

      const ws = result.joinedWorkspace || invitation.workspace;
      activateWorkspaceAndGo(ws, invitation.role);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Registration failed. If you already have an account, please switch to Sign In.';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. In-Page Sign In & Join (No redirect)
  const handleInPageLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !invitation) return;

    if (!password) {
      setFormError('Please enter your password.');
      return;
    }

    try {
      setIsProcessing(true);
      setFormError(null);

      // Sign in
      const loginResult = await authService.login({
        email: invitation.email,
        password,
      });
      setAuth(loginResult.user, loginResult.tokens);

      // Accept invitation
      const acceptResult = await workspaceService.acceptInvitation(token);
      const ws = acceptResult?.workspace || invitation.workspace;
      activateWorkspaceAndGo(ws, invitation.role);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Invalid password. Please check your credentials.';
      setFormError(msg);
      toast.error(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  // 4. Switch Account: Log out current user (e.g. Alice) and stay right here
  const handleSwitchAccount = () => {
    logout();
    setFormError(null);
    toast.info(`Signed out. You can now join as ${invitation?.email}.`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (!invitation || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
        <Card className="max-w-md w-full text-center p-6">
          <CardTitle>Invitation Expired or Invalid</CardTitle>
          <p className="text-xs text-slate-500 mt-2">
            This invitation link is no longer valid or has already been accepted.
          </p>
          <div className="mt-6">
            <Button onClick={() => navigate('/')}>Return Home</Button>
          </div>
        </Card>
      </div>
    );
  }

  const emailMatches = isAuthenticated && user?.email?.toLowerCase() === invitation.email?.toLowerCase();
  const emailMismatch = isAuthenticated && !emailMatches;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
      <Card className="max-w-md w-full shadow-lg border border-slate-200 dark:border-slate-800">
        <CardHeader className="text-center pb-2">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-3 dark:bg-indigo-950/60 dark:text-indigo-400">
            <Building2 className="w-6 h-6" />
          </div>
          <CardTitle className="text-xl">Join Workspace</CardTitle>
          <p className="text-xs text-slate-500 mt-1">
            You have been invited to collaborate on TeamFlow
          </p>
        </CardHeader>

        <CardContent className="space-y-5 pt-2">
          {/* Workspace Invitation Overview */}
          <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-200/80 dark:border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Workspace</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                {invitation.workspace?.name || 'Workspace'}
              </span>
            </div>

            {invitation.invitedBy && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Invited By</span>
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  {invitation.invitedBy.name}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">Invited Address</span>
              <span className="text-xs font-mono font-medium text-indigo-700 dark:text-indigo-300">
                {invitation.email}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
              <span className="text-xs text-slate-500">Assigned Role</span>
              <Badge variant={invitation.role === 'ADMIN' ? 'danger' : 'primary'} size="sm">
                {invitation.role}
              </Badge>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-1">
              {invitation.role === 'ADMIN' && '⭐ Admins have full access to manage projects, boards, and members.'}
              {invitation.role === 'MEMBER' && '🔹 Members can create, edit, and collaborate on projects and tasks.'}
              {invitation.role === 'GUEST' && '👁️ Guests have view-only access to assigned projects and tasks.'}
            </p>
          </div>

          {/* SCENARIO 1: Currently Logged In as a DIFFERENT user (e.g. Alice) */}
          {emailMismatch && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Session Mismatch</span>
                </div>
                <p className="mt-1.5 leading-relaxed">
                  You are currently logged in as <strong>{user?.email}</strong>. 
                  This invite is reserved exclusively for <strong>{invitation.email}</strong>.
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <Button
                  className="w-full"
                  onClick={handleSwitchAccount}
                  leftIcon={<LogOut className="w-4 h-4" />}
                >
                  Switch to {invitation.email} & Join
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => navigate('/dashboard')}
                >
                  Return to Current Dashboard
                </Button>
              </div>
            </div>
          )}

          {/* SCENARIO 2: Logged In with MATCHING email */}
          {emailMatches && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>Signed in as <strong>{user?.email}</strong>. Click below to enter the workspace!</span>
              </div>

              <Button
                className="w-full"
                isLoading={isProcessing}
                onClick={handleDirectAccept}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Accept & Go to Workspace Dashboard
              </Button>
            </div>
          )}

          {/* SCENARIO 3: NOT LOGGED IN — Complete in-page Join Form */}
          {!isAuthenticated && (
            <div className="space-y-4 pt-1">
              {formError && (
                <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-300 rounded-lg border border-rose-200 dark:border-rose-900">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Mode Toggle Tabs */}
              <div className="flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('REGISTER');
                    setFormError(null);
                  }}
                  className={`flex-1 py-1.5 font-medium rounded-md transition-all ${
                    authMode === 'REGISTER'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  New User (Register)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('LOGIN');
                    setFormError(null);
                  }}
                  className={`flex-1 py-1.5 font-medium rounded-md transition-all ${
                    authMode === 'LOGIN'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  Existing User (Sign In)
                </button>
              </div>

              {authMode === 'REGISTER' ? (
                /* Registration Form */
                <form onSubmit={handleInPageRegister} className="space-y-3">
                  <Input
                    label="Full Name"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    startIcon={<UserIcon className="w-4 h-4" />}
                    required
                  />

                  <Input
                    label="Email Address"
                    value={invitation.email}
                    disabled
                    startIcon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  />

                  <Input
                    label="Create Password"
                    type="password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    startIcon={<Lock className="w-4 h-4" />}
                    required
                  />

                  <Button
                    type="submit"
                    className="w-full mt-2"
                    isLoading={isProcessing}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Create Account & Open Dashboard
                  </Button>
                </form>
              ) : (
                /* Login Form */
                <form onSubmit={handleInPageLogin} className="space-y-3">
                  <Input
                    label="Email Address"
                    value={invitation.email}
                    disabled
                    startIcon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                  />

                  <Input
                    label="Password"
                    type="password"
                    placeholder="Enter your account password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    startIcon={<KeyRound className="w-4 h-4" />}
                    required
                  />

                  <Button
                    type="submit"
                    className="w-full mt-2"
                    isLoading={isProcessing}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Sign In & Open Dashboard
                  </Button>
                </form>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvitationPage;
