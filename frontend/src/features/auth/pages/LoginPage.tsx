import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { AuthLayout } from '../../../components/layout/AuthLayout';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { loginSchema, LoginFormData } from '../schemas/auth.schema';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../../../stores/auth-store';

export const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleQuickFill = (email: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', 'Password123!', { shouldValidate: true });
    setApiError(null);
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      setApiError(null);
      const result = await authService.login(data);
      setAuth(result.user, result.tokens);
      toast.success('Welcome back to TeamFlow!');
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Invalid email or password. Please verify your credentials.';
      setApiError(errorMsg);
      toast.error(errorMsg);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your account to continue managing projects."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {apiError && (
          <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-300 rounded-lg border border-rose-200 dark:border-rose-900">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{apiError}</span>
          </div>
        )}

        <Input
          label="Email address"
          type="email"
          placeholder="name@company.com"
          startIcon={<Mail className="w-4 h-4" />}
          error={errors.email?.message}
          {...register('email')}
        />

        <div>
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
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
          <div className="mt-1.5 flex justify-end">
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full mt-2"
          size="md"
          isLoading={isSubmitting}
        >
          Sign In
        </Button>

        <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="font-semibold text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            Create free account
          </Link>
        </div>

        {/* Demo Accounts Quick-Fill */}
        <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-2 text-center">
            Demo accounts (click to fill credentials):
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickFill('alice@teamflow.local')}
              className="text-left px-2 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 hover:border-primary-400 hover:bg-primary-50/40 dark:hover:bg-slate-800 text-xs transition-colors"
            >
              <div className="font-semibold text-slate-800 dark:text-slate-200">Alice</div>
              <div className="text-[10px] text-slate-500">Project Owner</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('bob@teamflow.local')}
              className="text-left px-2 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 hover:border-primary-400 hover:bg-primary-50/40 dark:hover:bg-slate-800 text-xs transition-colors"
            >
              <div className="font-semibold text-slate-800 dark:text-slate-200">Bob</div>
              <div className="text-[10px] text-slate-500">Developer</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('admin@teamflow.local')}
              className="text-left px-2 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 hover:border-primary-400 hover:bg-primary-50/40 dark:hover:bg-slate-800 text-xs transition-colors"
            >
              <div className="font-semibold text-slate-800 dark:text-slate-200">Admin</div>
              <div className="text-[10px] text-slate-500">Platform Admin</div>
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('charlie@teamflow.local')}
              className="text-left px-2 py-1.5 rounded-md border border-slate-200 dark:border-slate-700 hover:border-primary-400 hover:bg-primary-50/40 dark:hover:bg-slate-800 text-xs transition-colors"
            >
              <div className="font-semibold text-slate-800 dark:text-slate-200">Charlie</div>
              <div className="text-[10px] text-slate-500">Guest</div>
            </button>
          </div>
        </div>
      </form>
    </AuthLayout>
  );
};

export default LoginPage;
