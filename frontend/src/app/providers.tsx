import React, { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { queryClient } from './query-client';
import { useAuthStore } from '../stores/auth-store';
import { useUIStore } from '../stores/ui-store';

export interface ProvidersProps {
  children: React.ReactNode;
}

export const Providers: React.FC<ProvidersProps> = ({ children }) => {
  const initializeAuth = useAuthStore((s) => s.initialize);
  const theme = useUIStore((s) => s.theme);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-right"
        richColors
        closeButton
        theme={theme === 'dark' ? 'dark' : 'light'}
      />
    </QueryClientProvider>
  );
};
