import React, { Suspense } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { Providers } from './providers';

export const App: React.FC = () => {
  return (
    <Providers>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center" role="status">
            Loading page...
          </div>
        }
      >
        <RouterProvider router={router} />
      </Suspense>
    </Providers>
  );
};

export default App;
