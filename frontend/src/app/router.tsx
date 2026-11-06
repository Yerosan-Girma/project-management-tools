import { createBrowserRouter } from 'react-router-dom';
import LandingPage from '../features/landing/pages/LandingPage';
import LoginPage from '../features/auth/pages/LoginPage';
import RegisterPage from '../features/auth/pages/RegisterPage';
import ForgotPasswordPage from '../features/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from '../features/auth/pages/ResetPasswordPage';
import VerifyEmailPage from '../features/auth/pages/VerifyEmailPage';
import ProfilePage from '../features/auth/pages/ProfilePage';
import { GuestRoute } from '../components/layout/GuestRoute';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  // Guest only routes
  {
    element: <GuestRoute />,
    children: [
      {
        path: '/login',
        element: <LoginPage />,
      },
      {
        path: '/register',
        element: <RegisterPage />,
      },
      {
        path: '/forgot-password',
        element: <ForgotPasswordPage />,
      },
      {
        path: '/reset-password',
        element: <ResetPasswordPage />,
      },
    ],
  },
  // Public verification callback
  {
    path: '/verify-email',
    element: <VerifyEmailPage />,
  },
  // Protected routes placeholder (Profile and future dashboard routes)
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/profile',
        element: (
          <div className="p-8">
            <ProfilePage />
          </div>
        ),
      },
      {
        path: '/dashboard',
        element: (
          <div className="p-8 text-center">
            <h2 className="text-xl font-bold">Dashboard Placeholder</h2>
          </div>
        ),
      },
    ],
  },
]);
