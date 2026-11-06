import { createBrowserRouter, Navigate } from 'react-router-dom';
import LandingPage from '../features/landing/pages/LandingPage';
import LoginPage from '../features/auth/pages/LoginPage';
import RegisterPage from '../features/auth/pages/RegisterPage';
import ForgotPasswordPage from '../features/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from '../features/auth/pages/ResetPasswordPage';
import VerifyEmailPage from '../features/auth/pages/VerifyEmailPage';
import ProfilePage from '../features/auth/pages/ProfilePage';
import WorkspacesPage from '../features/workspaces/pages/WorkspacesPage';
import WorkspaceDetailPage from '../features/workspaces/pages/WorkspaceDetailPage';
import ProjectsPage from '../features/projects/pages/ProjectsPage';
import ProjectDetailPage from '../features/projects/pages/ProjectDetailPage';
import MyTasksPage from '../features/tasks/pages/MyTasksPage';
import NotificationsPage from '../features/notifications/pages/NotificationsPage';
import AcceptInvitationPage from '../features/invitations/pages/AcceptInvitationPage';
import { GuestRoute } from '../components/layout/GuestRoute';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { AppLayout } from '../components/layout/AppLayout';

export const router = createBrowserRouter([
  // Public Marketing
  {
    path: '/',
    element: <LandingPage />,
  },
  // Public / Token Invitations
  {
    path: '/invitations/:token',
    element: <AcceptInvitationPage />,
  },
  {
    path: '/verify-email',
    element: <VerifyEmailPage />,
  },
  // Guest-only auth routes
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
  // Protected Application Shell
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: '/dashboard',
            element: <Navigate to="/projects" replace />,
          },
          {
            path: '/workspaces',
            element: <WorkspacesPage />,
          },
          {
            path: '/workspaces/:workspaceId',
            element: <WorkspaceDetailPage />,
          },
          {
            path: '/projects',
            element: <ProjectsPage />,
          },
          {
            path: '/projects/:projectId',
            element: <ProjectDetailPage />,
          },
          {
            path: '/my-tasks',
            element: <MyTasksPage />,
          },
          {
            path: '/notifications',
            element: <NotificationsPage />,
          },
          {
            path: '/profile',
            element: <ProfilePage />,
          },
        ],
      },
    ],
  },
]);
