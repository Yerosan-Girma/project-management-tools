import { createBrowserRouter } from 'react-router-dom';
import LandingPage from '../features/landing/pages/LandingPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
]);
