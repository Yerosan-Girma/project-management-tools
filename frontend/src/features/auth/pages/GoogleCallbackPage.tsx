import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuthStore } from '../../../stores/auth-store';
import { authService } from '../services/auth.service';

export const GoogleCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuth = async () => {
      const accessToken = searchParams.get('accessToken');
      const refreshToken = searchParams.get('refreshToken');
      const code = searchParams.get('code');
      const err = searchParams.get('error');

      if (err) {
        setError(err);
        toast.error(err);
        setTimeout(() => navigate('/login', { replace: true }), 2500);
        return;
      }

      try {
        if (accessToken) {
          // Direct tokens passed back from backend OAuth exchange
          localStorage.setItem('teamflow_access_token', accessToken);
          if (refreshToken) {
            localStorage.setItem('teamflow_refresh_token', refreshToken);
          }
          const user = await authService.getCurrentUser();
          setAuth(user, { accessToken, refreshToken: refreshToken || undefined });
          toast.success(`Welcome to TeamFlow, ${user.name}!`);
          navigate('/dashboard', { replace: true });
          return;
        }

        if (code) {
          // Authorization code flow
          const redirectUri = window.location.origin + window.location.pathname;
          const result = await authService.loginWithGoogle({ code, redirectUri });
          setAuth(result.user, result.tokens);
          toast.success(`Welcome to TeamFlow, ${result.user.name}!`);
          navigate('/dashboard', { replace: true });
          return;
        }

        // Neither tokens nor code found
        navigate('/login', { replace: true });
      } catch (err: any) {
        const errorMsg = err?.response?.data?.message || err.message || 'Google authentication failed.';
        setError(errorMsg);
        toast.error(errorMsg);
        setTimeout(() => navigate('/login', { replace: true }), 2500);
      }
    };

    handleAuth();
  }, [searchParams, navigate, setAuth]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 text-center dark:bg-slate-950">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
        {error ? (
          <div>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Authentication Failed</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{error}</p>
            <p className="mt-4 text-xs text-slate-400">Redirecting to login...</p>
          </div>
        ) : (
          <div>
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-3 border-primary-600 border-t-transparent" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Signing in with Google...</h2>
            <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">Verifying your account credentials. Please wait a moment.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoogleCallbackPage;
