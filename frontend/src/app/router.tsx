import { createBrowserRouter } from 'react-router-dom';

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6 text-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">TeamFlow</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Project Management & Collaboration Platform
          </p>
        </div>
      </div>
    ),
  },
]);
