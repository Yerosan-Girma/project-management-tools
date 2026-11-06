import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../stores/auth-store';
import { User, AuthTokens } from '../types/auth.types';

describe('Auth Store Test Suite', () => {
  const mockUser: User = {
    id: 'user-uuid-1',
    name: 'Alice Cooper',
    email: 'alice@teamflow.io',
    platformRole: 'USER',
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
  };

  const mockTokens: AuthTokens = {
    accessToken: 'test-access-token',
    refreshToken: 'test-refresh-token',
  };

  beforeEach(() => {
    localStorage.clear();
    useAuthStore.getState().logout();
  });

  it('initializes with unauthenticated empty state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('sets user, tokens and updates localStorage on setAuth', () => {
    useAuthStore.getState().setAuth(mockUser, mockTokens);

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.accessToken).toBe('test-access-token');
    expect(state.isAuthenticated).toBe(true);

    expect(localStorage.getItem('teamflow_access_token')).toBe('test-access-token');
    expect(localStorage.getItem('teamflow_refresh_token')).toBe('test-refresh-token');
  });

  it('clears state and removes localStorage on logout', () => {
    useAuthStore.getState().setAuth(mockUser, mockTokens);
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.accessToken).toBeNull();
    expect(state.isAuthenticated).toBe(false);

    expect(localStorage.getItem('teamflow_access_token')).toBeNull();
    expect(localStorage.getItem('teamflow_refresh_token')).toBeNull();
  });
});
