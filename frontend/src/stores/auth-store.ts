import { create } from 'zustand';
import { User, AuthTokens } from '../types/auth.types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setAuth: (user: User, tokens: AuthTokens) => void;
  setTokens: (tokens: AuthTokens) => void;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => {
    if (user) {
      localStorage.setItem('teamflow_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('teamflow_user');
    }
    set({ user, isAuthenticated: Boolean(user) });
  },

  setAuth: (user, tokens) => {
    localStorage.setItem('teamflow_user', JSON.stringify(user));
    localStorage.setItem('teamflow_access_token', tokens.accessToken);
    if (tokens.refreshToken) {
      localStorage.setItem('teamflow_refresh_token', tokens.refreshToken);
    }
    set({
      user,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken || null,
      isAuthenticated: true,
      isLoading: false,
    });
  },

  setTokens: (tokens) => {
    localStorage.setItem('teamflow_access_token', tokens.accessToken);
    if (tokens.refreshToken) {
      localStorage.setItem('teamflow_refresh_token', tokens.refreshToken);
    }
    set((state) => ({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken || state.refreshToken,
    }));
  },

  logout: () => {
    localStorage.removeItem('teamflow_user');
    localStorage.removeItem('teamflow_access_token');
    localStorage.removeItem('teamflow_refresh_token');
    localStorage.removeItem('teamflow_active_workspace_id');
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });
  },

  initialize: () => {
    try {
      const storedUser = localStorage.getItem('teamflow_user');
      const token = localStorage.getItem('teamflow_access_token');
      const refreshToken = localStorage.getItem('teamflow_refresh_token');

      if (token && storedUser) {
        set({
          user: JSON.parse(storedUser),
          accessToken: token,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },
}));
