import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  User as UserIcon,
  Lock,
  Building2,
  Users,
  Bell,
  Shield,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../../../stores/auth-store';
import { useWorkspaceStore } from '../../../stores/workspace-store';
import { authService } from '../../auth/services/auth.service';
import { workspaceService } from '../../workspaces/services/workspace.service';
import {
  profileUpdateSchema,
  ProfileUpdateFormData,
  changePasswordSchema,
  ChangePasswordFormData,
} from '../../auth/schemas/auth.schema';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { Modal } from '../../../components/ui/Modal';

type SettingsTab = 'profile' | 'security' | 'workspace' | 'team' | 'notifications';

export const SettingsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as SettingsTab) || 'profile';
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);

  const { user, setUser } = useAuthStore();
  const { currentWorkspace, updateWorkspaceInStore, setWorkspaces } = useWorkspaceStore();
  const navigate = useNavigate();

  // Sync tab with URL
  const handleTabChange = (tab: SettingsTab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // 1. Profile Form
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    formState: { errors: profileErrors, isSubmitting: isSubmittingProfile },
  } = useForm<ProfileUpdateFormData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      name: user?.name || '',
      avatarUrl: user?.avatarUrl || '',
    },
  });

  const onUpdateProfile = async (data: ProfileUpdateFormData) => {
    try {
      const updated = await authService.updateProfile({
        name: data.name,
        avatarUrl: data.avatarUrl || undefined,
      });
      setUser(updated);
      toast.success('Profile details saved successfully');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to update profile';
      toast.error(msg);
    }
  };

  // 2. Password Change Form
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors, isSubmitting: isSubmittingPassword },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onChangePassword = async (data: ChangePasswordFormData) => {
    try {
      await authService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      toast.success('Password changed successfully');
      resetPasswordForm();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to change password. Please verify your current password.';
      toast.error(msg);
    }
  };

  // 3. Workspace Settings Form
  const [wsName, setWsName] = useState(currentWorkspace?.name || '');
  const [wsDescription, setWsDescription] = useState(currentWorkspace?.description || '');
  const [isSavingWorkspace, setIsSavingWorkspace] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingWs, setIsDeletingWs] = useState(false);

  useEffect(() => {
    if (currentWorkspace) {
      setWsName(currentWorkspace.name);
      setWsDescription(currentWorkspace.description || '');
    }
  }, [currentWorkspace]);

  const onSaveWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspace?.id || !wsName.trim()) return;
    try {
      setIsSavingWorkspace(true);
      const updated = await workspaceService.updateWorkspace(currentWorkspace.id, {
        name: wsName.trim(),
        description: wsDescription.trim() || undefined,
      });
      updateWorkspaceInStore(updated);
      toast.success('Workspace details updated successfully');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to update workspace';
      toast.error(msg);
    } finally {
      setIsSavingWorkspace(false);
    }
  };

  const onDeleteWorkspace = async () => {
    if (!currentWorkspace?.id || deleteConfirmText !== currentWorkspace.name) return;
    try {
      setIsDeletingWs(true);
      await workspaceService.deleteWorkspace(currentWorkspace.id);
      toast.success(`Workspace "${currentWorkspace.name}" deleted`);
      setIsDeleteModalOpen(false);
      const freshList = await workspaceService.getWorkspaces();
      setWorkspaces(freshList);
      navigate('/dashboard');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to delete workspace';
      toast.error(msg);
    } finally {
      setIsDeletingWs(false);
    }
  };

  // 4. Notification Preferences
  const [notifyAssignments, setNotifyAssignments] = useState(true);
  const [notifyComments, setNotifyComments] = useState(true);
  const [notifyDeadlines, setNotifyDeadlines] = useState(true);

  const isOwner = currentWorkspace?.ownerId === user?.id || user?.platformRole === 'PLATFORM_ADMIN';

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Settings & Preferences
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your personal account, security credentials, active workspace, and notification preferences.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold overflow-x-auto pb-0.5">
        <button
          onClick={() => handleTabChange('profile')}
          className={`pb-3 px-2 border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'profile'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          <span>Personal Profile</span>
        </button>

        <button
          onClick={() => handleTabChange('security')}
          className={`pb-3 px-2 border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'security'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Account Security</span>
        </button>

        <button
          onClick={() => handleTabChange('workspace')}
          className={`pb-3 px-2 border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'workspace'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Workspace Settings</span>
        </button>

        <button
          onClick={() => handleTabChange('team')}
          className={`pb-3 px-2 border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'team'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Team & Permissions</span>
        </button>

        <button
          onClick={() => handleTabChange('notifications')}
          className={`pb-3 px-2 border-b-2 transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'notifications'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Notifications</span>
        </button>
      </div>

      {/* 1. PROFILE TAB */}
      {activeTab === 'profile' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 space-y-6">
          <div className="flex items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
            <Avatar src={user?.avatarUrl} name={user?.name} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {user?.name}
                </h3>
                <Badge variant="primary" size="sm">
                  {user?.platformRole === 'PLATFORM_ADMIN' ? 'Platform Admin' : 'Standard User'}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmitProfile(onUpdateProfile)} className="space-y-4 max-w-lg">
            <Input
              label="Full Name"
              error={profileErrors.name?.message}
              {...registerProfile('name')}
            />

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Input
                  value={user?.email || ''}
                  disabled
                  className="bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed opacity-80"
                />
                <span className="absolute right-3 top-2.5 flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Primary identifier used for workspace assignments and authentication.
              </p>
            </div>

            <Input
              label="Avatar URL (Optional)"
              placeholder="https://..."
              error={profileErrors.avatarUrl?.message}
              {...registerProfile('avatarUrl')}
            />

            <div className="pt-2">
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmittingProfile}>
                Save Profile Changes
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* 2. SECURITY TAB */}
      {activeTab === 'security' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Change Account Password
            </h3>
            <p className="text-xs text-slate-500">
              Ensure your account uses a secure password with at least 8 characters, numbers, and symbols.
            </p>
          </div>

          <form onSubmit={handleSubmitPassword(onChangePassword)} className="space-y-4 max-w-lg">
            <Input
              label="Current Password"
              type="password"
              placeholder="••••••••"
              error={passwordErrors.currentPassword?.message}
              {...registerPassword('currentPassword')}
            />

            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              error={passwordErrors.newPassword?.message}
              {...registerPassword('newPassword')}
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
              error={passwordErrors.confirmPassword?.message}
              {...registerPassword('confirmPassword')}
            />

            <div className="pt-2">
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmittingPassword}>
                Update Password
              </Button>
            </div>
          </form>

          {/* Active Session Info */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Active Security Status
            </h4>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-emerald-500" />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">
                    Argon2id & JWT Token Family Active
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Auto-rotation enabled with compromise detection.
                  </p>
                </div>
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold">Protected</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. WORKSPACE SETTINGS TAB */}
      {activeTab === 'workspace' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Active Workspace Profile
            </h3>
            <p className="text-xs text-slate-500">
              General settings for <strong>{currentWorkspace?.name}</strong>.
            </p>
          </div>

          <form onSubmit={onSaveWorkspace} className="space-y-4 max-w-lg">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Workspace Name <span className="text-rose-500">*</span>
              </label>
              <Input
                value={wsName}
                onChange={(e) => setWsName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Workspace Description
              </label>
              <Textarea
                rows={3}
                value={wsDescription}
                onChange={(e) => setWsDescription(e.target.value)}
                placeholder="Describe this workspace's mission or purpose..."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Workspace Slug
              </label>
              <Input
                value={currentWorkspace?.slug || ''}
                disabled
                className="bg-slate-50 dark:bg-slate-800/50 cursor-not-allowed opacity-80"
              />
            </div>

            <div className="pt-2">
              <Button type="submit" variant="primary" size="sm" isLoading={isSavingWorkspace}>
                Save Workspace Settings
              </Button>
            </div>
          </form>

          {/* Danger Zone (Owner Only) */}
          {isOwner && (
            <div className="pt-6 border-t border-rose-100 dark:border-rose-950/60 space-y-3">
              <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                Danger Zone
              </h4>
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 dark:border-rose-900/60 dark:bg-rose-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-rose-900 dark:text-rose-200">
                    Delete this Workspace
                  </p>
                  <p className="text-[11px] text-rose-700/80 dark:text-rose-400">
                    Permanently removes all enrolled projects, tasks, boards, and member associations.
                  </p>
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="shrink-0 text-xs"
                >
                  Delete Workspace
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. TEAM & PERMISSIONS TAB */}
      {activeTab === 'team' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                Team Access & Membership
              </h3>
              <p className="text-xs text-slate-500">
                Workspace team members, roles, and project allocations.
              </p>
            </div>

            <Link to="/team">
              <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                Open Team Directory
              </Button>
            </Link>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-xs space-y-2">
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              Centralized Team Portal
            </p>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              To invite new collaborators, update roles (Admin, Member, Guest), or manage invitations, visit the unified Team Management interface.
            </p>
          </div>
        </div>
      )}

      {/* 5. NOTIFICATION PREFERENCES TAB */}
      {activeTab === 'notifications' && (
        <div className="rounded-2xl border border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900 p-6 space-y-6">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Notification Preferences
            </h3>
            <p className="text-xs text-slate-500">
              Choose which in-app updates and triggers you wish to receive.
            </p>
          </div>

          <div className="space-y-4 max-w-lg text-xs">
            <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Task Assignments</p>
                <p className="text-[11px] text-slate-400">Receive alerts when teammates assign deliverables to you.</p>
              </div>
              <input
                type="checkbox"
                checked={notifyAssignments}
                onChange={(e) => {
                  setNotifyAssignments(e.target.checked);
                  toast.success('Preference updated');
                }}
                className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Task Comments & Mentions</p>
                <p className="text-[11px] text-slate-400">Receive updates when comments are posted on your deliverables.</p>
              </div>
              <input
                type="checkbox"
                checked={notifyComments}
                onChange={(e) => {
                  setNotifyComments(e.target.checked);
                  toast.success('Preference updated');
                }}
                className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Upcoming Deadline Reminders</p>
                <p className="text-[11px] text-slate-400">Urgent notifications when deliverable due dates approach within 24 hours.</p>
              </div>
              <input
                type="checkbox"
                checked={notifyDeadlines}
                onChange={(e) => {
                  setNotifyDeadlines(e.target.checked);
                  toast.success('Preference updated');
                }}
                className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
              />
            </label>
          </div>
        </div>
      )}

      {/* Delete Workspace Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Workspace Deletion"
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>This action cannot be undone. All project data will be lost.</span>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-300">
            Please type <strong className="text-slate-900 dark:text-white">{currentWorkspace?.name}</strong> to confirm:
          </p>

          <Input
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder={currentWorkspace?.name}
          />

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={isDeletingWs}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              isLoading={isDeletingWs}
              disabled={deleteConfirmText !== currentWorkspace?.name}
              onClick={onDeleteWorkspace}
            >
              Permanently Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SettingsPage;
