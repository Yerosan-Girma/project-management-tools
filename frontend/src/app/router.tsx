import { createBrowserRouter, Navigate } from 'react-router-dom';
import LandingPage from '../features/landing/pages/LandingPage';
import FeaturesPage from '../features/landing/pages/FeaturesPage';
import HowItWorksPage from '../features/landing/pages/HowItWorksPage';
import PricingPage from '../features/landing/pages/PricingPage';
import FaqPage from '../features/landing/pages/FaqPage';
import AboutPage from '../features/landing/pages/AboutPage';
import SecurityPage from '../features/landing/pages/SecurityPage';
import ContactPage from '../features/landing/pages/ContactPage';
import LoginPage from '../features/auth/pages/LoginPage';
import RegisterPage from '../features/auth/pages/RegisterPage';
import ForgotPasswordPage from '../features/auth/pages/ForgotPasswordPage';
import ResetPasswordPage from '../features/auth/pages/ResetPasswordPage';
import VerifyEmailPage from '../features/auth/pages/VerifyEmailPage';
import DashboardPage from '../features/dashboard/pages/DashboardPage';
import CalendarPage from '../features/calendar/pages/CalendarPage';
import WorkspacesPage from '../features/workspaces/pages/WorkspacesPage';
import WorkspaceDetailPage from '../features/workspaces/pages/WorkspaceDetailPage';
import ProjectsPage from '../features/projects/pages/ProjectsPage';
import ProjectDetailPage from '../features/projects/pages/ProjectDetailPage';
import MyTasksPage from '../features/tasks/pages/MyTasksPage';
import TeamPage from '../features/team/pages/TeamPage';
import SettingsPage from '../features/settings/pages/SettingsPage';
import NotificationsPage from '../features/notifications/pages/NotificationsPage';
import AcceptInvitationPage from '../features/invitations/pages/AcceptInvitationPage';
import { GuestRoute } from '../components/layout/GuestRoute';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { AppLayout } from '../components/layout/AppLayout';
import { MarketingLayout } from '../components/layout/MarketingLayout';

export const router = createBrowserRouter([
  {
    element: <MarketingLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/features', element: <FeaturesPage /> },
      { path: '/how-it-works', element: <HowItWorksPage /> },
      { path: '/pricing', element: <PricingPage /> },
      { path: '/faq', element: <FaqPage /> },
      { path: '/about', element: <AboutPage /> },
      { path: '/security', element: <SecurityPage /> },
      { path: '/contact', element: <ContactPage /> },
    ],
  },
  // Public / Token Invitations
  {
    path: '/invitations/:token',
    element: <AcceptInvitationPage />,
  },
  {
    path: '/invitations/accept',
    element: <AcceptInvitationPage />,
  },
  {
    path: '/invitations',
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
            path: '/app',
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: '/dashboard',
            element: <DashboardPage />,
          },
          {
            path: '/my-tasks',
            element: <MyTasksPage />,
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
            path: '/team',
            element: <TeamPage />,
          },
          {
            path: '/settings',
            element: <SettingsPage />,
          },
          {
            path: '/notifications',
            element: <NotificationsPage />,
          },
          {
            path: '/calendar',
            element: <CalendarPage />,
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
            path: '/profile',
            element: <Navigate to="/settings?tab=profile" replace />,
          },
        ],
      },
    ],
  },
  // Fallback catch-all route
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
