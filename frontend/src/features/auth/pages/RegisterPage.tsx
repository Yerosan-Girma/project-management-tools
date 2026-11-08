import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User as UserIcon, Eye, EyeOff, AlertCircle, Check, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { AuthLayout } from '../../../components/layout/AuthLayout';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { registerSchema, RegisterFormData } from '../schemas/auth.schema';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../../../stores/auth-store';
import { useWorkspaceStore } from '../../../stores/workspace-store';

export const RegisterPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const inviteToken = searchParams.get('inviteToken') || undefined;
  const emailParam = searchParams.get('email') || '';

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: emailParam || '',
      password: '',
      confirmPassword: '',
    },
  });

  const passwordValue = watch('password') || '';
  const hasMinLength = passwordValue.length >= 8;
  const hasUppercase = /[A-Z]/.test(passwordValue);
  const hasLowercase = /[a-z]/.test(passwordValue);
  const hasNumber = /[0-9]/.test(passwordValue);

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setApiError(null);
      const result = await authService.register({
        name: data.name,
        email: data.email,
        password: data.password,
        inviteToken,
      });

      setAuth(result.user, result.tokens);

      if (result.joinedWorkspace) {
        useWorkspaceStore.getState().setCurrentWorkspace(result.joinedWorkspace);
        useWorkspaceStore.getState().addWorkspace(result.joinedWorkspace);
        toast.success(`Account created! Joined ${result.joinedWorkspace.name} as ${result.assignedRole || 'member'}.`);
      } else {
        toast.success('Account created successfully! Welcome to TeamFlow.');
      }
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Registration failed. This email may already be registered.';
      setApiError(errorMsg);
      toast.error(errorMsg);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Start collaborating with your team in high gear."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {(emailParam || inviteToken) && (
          <div className="flex items-center gap-2 p-3 text-xs text-indigo-700 bg-indigo-50 dark:bg-indigo-950/50 dark:text-indigo-300 rounded-lg border border-indigo-200 dark:border-indigo-900">
            <Sparkles className="w-4 h-4 shrink-0 text-indigo-500" />
            <span>
              Joining via invitation: <strong>{emailParam || 'Pending invite'}</strong>. Your account will automatically join the workspace!
            </span>
          </div>
        )}

        {apiError && (
          <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-300 rounded-lg border border-rose-200 dark:border-rose-900">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{apiError}</span>
          </div>
        )}

        <Input
          label="Full name"
          placeholder="Jane Doe"
          startIcon={<UserIcon className="w-4 h-4" />}
          error={errors.name?.message}
          {...register('name')}
        />

        <Input
          label="Work email"
          type="email"
          placeholder="jane@company.com"
          startIcon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Create strong password"
          startIcon={<Lock className="w-4 h-4" />}
          endIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="focus:outline-none hover:text-slate-600 dark:hover:text-slate-200"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          }
          error={errors.password?.message}
          {...register('password')}
        />

        {/* Password Strength Checklist */}
        <div className="grid grid-cols-2 gap-1.5 py-1 text-[11px] text-slate-500">
          <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600 font-medium' : ''}`}>
            <Check className={`w-3.5 h-3.5 ${hasMinLength ? 'text-emerald-600' : 'text-slate-300'}`} />
            <span>8+ characters</span>
          </div>
          <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-emerald-600 font-medium' : ''}`}>
            <Check className={`w-3.5 h-3.5 ${hasUppercase ? 'text-emerald-600' : 'text-slate-300'}`} />
            <span>1 uppercase letter</span>
          </div>
          <div className={`flex items-center gap-1.5 ${hasLowercase ? 'text-emerald-600 font-medium' : ''}`}>
            <Check className={`w-3.5 h-3.5 ${hasLowercase ? 'text-emerald-600' : 'text-slate-300'}`} />
            <span>1 lowercase letter</span>
          </div>
          <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-600 font-medium' : ''}`}>
            <Check className={`w-3.5 h-3.5 ${hasNumber ? 'text-emerald-600' : 'text-slate-300'}`} />
            <span>1 number</span>
          </div>
        </div>

        <Input
          label="Confirm password"
          type={showPassword ? 'text' : 'password'}
          placeholder="Re-enter password"
          startIcon={<Lock className="w-4 h-4" />}
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <Button
          type="submit"
          className="w-full mt-2"
          size="md"
          isLoading={isSubmitting}
        >
          Create Account
        </Button>

        <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            Sign in
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default RegisterPage;
