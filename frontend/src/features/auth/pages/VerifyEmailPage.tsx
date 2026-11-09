import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { AuthLayout } from '../../../components/layout/AuthLayout';
import { Button } from '../../../components/ui/Button';
import { authService } from '../services/auth.service';
import { getErrorMessage } from '../../../utils/error';

export const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('No verification token provided in URL.');
      return;
    }

    const verify = async () => {
      try {
        await authService.verifyEmail(token);
        setStatus('success');
      } catch (err: unknown) {
        setStatus('error');
        const msg = getErrorMessage(err, 'Email verification link is invalid or expired.');
        setErrorMessage(msg);
      }
    };

    verify();
  }, [token]);

  return (
    <AuthLayout
      title="Email Verification"
      subtitle="Confirming your email address for TeamFlow."
    >
      <div className="py-6 text-center">
        {status === 'verifying' && (
          <div className="space-y-4">
            <Loader2 className="w-10 h-10 animate-spin text-primary-600 mx-auto" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Validating your verification token...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto dark:bg-emerald-950/60 dark:text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Email Verified Successfully!
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Your email address has been verified. You can now access all workspace features.
              </p>
            </div>
            <div className="pt-2">
              <Link to="/login">
                <Button className="w-full" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Sign In to Continue
                </Button>
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto dark:bg-rose-950/60 dark:text-rose-400">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Verification Failed
              </h3>
              <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                {errorMessage}
              </p>
            </div>
            <div className="pt-2">
              <Link to="/login">
                <Button variant="outline" className="w-full">
                  Return to Sign In
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </AuthLayout>
  );
};

export default VerifyEmailPage;
