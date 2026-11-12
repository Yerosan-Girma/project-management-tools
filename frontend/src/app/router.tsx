import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

const LandingPage = lazy(() => import('../features/landing/pages/LandingPage'));
const FeaturesPage = lazy(() => import('../features/landing/pages/FeaturesPage'));
const HowItWorksPage = lazy(() => import('../features/landing/pages/HowItWorksPage'));
const PricingPage = lazy(() => import('../features/landing/pages/PricingPage'));
const FaqPage = lazy(() => import('../features/landing/pages/FaqPage'));
const AboutPage = lazy(() => import('../features/landing/pages/AboutPage'));
const SecurityPage = lazy(() => import('../features/landing/pages/SecurityPage'));
const ContactPage = lazy(() => import('../features/landing/pages/ContactPage'));
const LoginPage = lazy(() => import('../features/auth/pages/LoginPage'));
const RegisterPage = lazy(() => import('../features/auth/pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('../features/auth/pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../features/auth/pages/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('../features/auth/pages/VerifyEmailPage'));
const GoogleCallbackPage = lazy(() => import('../features/auth/pages/GoogleCallbackPage'));
const DashboardPage = lazy(() => import('../features/dashboard/pages/DashboardPage'));
const CalendarPage = lazy(() => import('../features/calendar/pages/CalendarPage'));
const WorkspacesPage = lazy(() => import('../features/workspaces/pages/WorkspacesPage'));
const WorkspaceDetailPage = lazy(() => import('../features/workspaces/pages/WorkspaceDetailPage'));
const ProjectsPage = lazy(() => import('../features/projects/pages/ProjectsPage'));
const ProjectDetailPage = lazy(() => import('../features/projects/pages/ProjectDetailPage'));
const MyTasksPage = lazy(() => import('../features/tasks/pages/MyTasksPage'));
const TeamPage = lazy(() => import('../features/team/pages/TeamPage'));
const SettingsPage = lazy(() => import('../features/settings/pages/SettingsPage'));
const NotificationsPage = lazy(() => import('../features/notifications/pages/NotificationsPage'));
const AcceptInvitationPage = lazy(() => import('../features/invitations/pages/AcceptInvitationPage'));
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
  {
    path: '/auth/google/callback',
    element: <GoogleCallbackPage />,
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
