import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { User as UserIcon, Lock, CheckCircle2, Shield, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '../../../stores/auth-store';
import { authService } from '../services/auth.service';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import {
  profileUpdateSchema,
  ProfileUpdateFormData,
  changePasswordSchema,
  ChangePasswordFormData,
} from '../schemas/auth.schema';

export const ProfilePage: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'general' | 'security'>('general');

  // Profile form
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

  // Password form
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

  const onUpdateProfile = async (data: ProfileUpdateFormData) => {
    try {
      const updatedUser = await authService.updateProfile({
        name: data.name,
        avatarUrl: data.avatarUrl || undefined,
      });
      setUser(updatedUser);
      toast.success('Profile details updated successfully');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to update profile';
      toast.error(msg);
    }
  };

  const onChangePassword = async (data: ChangePasswordFormData) => {
    try {
      await authService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      resetPasswordForm();
      toast.success('Password changed successfully');
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Current password is incorrect';
      toast.error(msg);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Title & User Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <Avatar
            src={user?.avatarUrl}
            name={user?.name}
            size="lg"
            className="ring-4 ring-primary-100 dark:ring-primary-950"
          />
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              {user?.name}
              {user?.emailVerifiedAt && (
                <span title="Verified Account">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="primary" size="md">
            <Shield className="w-3 h-3 mr-1" />
            {user?.platformRole || 'USER'}
          </Badge>
          {user?.createdAt && (
            <Badge variant="outline" size="md">
              <Calendar className="w-3 h-3 mr-1" />
              Joined {new Date(user.createdAt).toLocaleDateString()}
            </Badge>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'general'
              ? 'bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <UserIcon className="w-4 h-4" />
          General Profile
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
            activeTab === 'security'
              ? 'bg-primary-50 text-primary-600 dark:bg-primary-950/60 dark:text-primary-400'
              : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
          }`}
        >
          <Lock className="w-4 h-4" />
          Security & Password
        </button>
      </div>

      {/* Tab 1: General */}
      {activeTab === 'general' && (
        <Card>
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitProfile(onUpdateProfile)} className="space-y-4 max-w-lg">
              <Input
                label="Full name"
                error={profileErrors.name?.message}
                {...registerProfile('name')}
              />

              <Input
                label="Email address"
                value={user?.email || ''}
                disabled
                helperText="Email address cannot be changed directly."
              />

              <Input
                label="Avatar image URL"
                placeholder="https://example.com/avatar.jpg"
                error={profileErrors.avatarUrl?.message}
                helperText="Enter a direct link to a publicly hosted image."
                {...registerProfile('avatarUrl')}
              />

              <div className="pt-2">
                <Button type="submit" isLoading={isSubmittingProfile}>
                  Save Changes
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tab 2: Security */}
      {activeTab === 'security' && (
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitPassword(onChangePassword)} className="space-y-4 max-w-lg">
              <Input
                label="Current password"
                type="password"
                error={passwordErrors.currentPassword?.message}
                {...registerPassword('currentPassword')}
              />

              <Input
                label="New password"
                type="password"
                placeholder="At least 8 chars with uppercase, lowercase, number"
                error={passwordErrors.newPassword?.message}
                {...registerPassword('newPassword')}
              />

              <Input
                label="Confirm new password"
                type="password"
                error={passwordErrors.confirmPassword?.message}
                {...registerPassword('confirmPassword')}
              />

              <div className="pt-2">
                <Button type="submit" isLoading={isSubmittingPassword}>
                  Update Password
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProfilePage;
