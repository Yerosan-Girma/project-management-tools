import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authService } from '../services/auth.service';
import { useAuthStore } from '../../../stores/auth-store';
import { getErrorMessage } from '../../../utils/error';

interface GoogleLoginButtonProps {
  inviteToken?: string;
  from?: string;
  label?: string;
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  inviteToken,
  from = '/dashboard',
  label = 'Continue with Google',
}) => {
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const rawClientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    '1080413359994-bubuvlr55ln40fd5nugqusv29gojnb7t.apps.googleusercontent.com';
  const clientIdMatch = rawClientId.match(/([0-9]+-[a-z0-9_]+\.apps\.googleusercontent\.com)/i);
  const clientId = clientIdMatch ? clientIdMatch[1].trim() : rawClientId.trim().replace(/^["']|["']$/g, '');

  useEffect(() => {
    // Check if Google Identity Services SDK is loaded
    if (typeof window !== 'undefined' && (window as any).google?.accounts?.id && clientId) {
      try {
        (window as any).google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: { credential?: string }) => {
            if (!response.credential) return;
            try {
              setLoading(true);
              const result = await authService.loginWithGoogle({
                idToken: response.credential,
                inviteToken,
              });
              setAuth(result.user, result.tokens);
              toast.success(`Welcome to TeamFlow, ${result.user.name}!`);
              navigate(from, { replace: true });
            } catch (err) {
              const msg = getErrorMessage(err, 'Failed to sign in with Google.');
              toast.error(msg);
            } finally {
              setLoading(false);
            }
          },
        });
      } catch (e) {
        // Non-blocking initialization
      }
    }
  }, [clientId, inviteToken, from, navigate, setAuth]);

  const handleGoogleClick = () => {
    setLoading(true);

    // If Google Identity prompt is available, try it first
    if ((window as any).google?.accounts?.id) {
      (window as any).google.accounts.id.prompt((notification: any) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // Fall back to direct OAuth redirect if One Tap prompt was skipped or not displayed
          redirectToGoogleOAuth();
        }
      });
      return;
    }

    redirectToGoogleOAuth();
  };

  const redirectToGoogleOAuth = () => {
    const isProduction =
      window.location.hostname.includes('vercel.app') ||
      !window.location.hostname.includes('localhost');

    const backendUrl = isProduction
      ? 'https://project-management-tools-tee6.onrender.com'
      : (import.meta.env.VITE_SOCKET_URL || 'http://localhost:8000');

    const redirectUri = `${backendUrl}/api/v1/auth/google/callback`;

    const stateObj = {
      from,
      inviteToken: inviteToken || undefined,
      origin: window.location.origin,
    };

    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.set('client_id', clientId);
    googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
    googleAuthUrl.searchParams.set('response_type', 'code');
    googleAuthUrl.searchParams.set('scope', 'openid email profile');
    googleAuthUrl.searchParams.set('access_type', 'offline');
    googleAuthUrl.searchParams.set('prompt', 'consent');
    googleAuthUrl.searchParams.set('state', JSON.stringify(stateObj));

    window.location.href = googleAuthUrl.toString();
  };

  return (
    <button
      type="button"
      onClick={handleGoogleClick}
      disabled={loading}
      className="relative flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-xs transition-all hover:bg-slate-50 hover:border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800/80 dark:hover:border-slate-700"
    >
      {loading ? (
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
      ) : (
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.15z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.26 21.36 7.36 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.27A7.18 7.18 0 0 1 4.9 12c0-.79.14-1.57.38-2.27V6.58H1.26A11.967 11.967 0 0 0 0 12c0 1.92.45 3.74 1.26 5.42l4.02-3.15z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
          />
        </svg>
      )}
      <span>{loading ? 'Connecting to Google...' : label}</span>
    </button>
  );
};
