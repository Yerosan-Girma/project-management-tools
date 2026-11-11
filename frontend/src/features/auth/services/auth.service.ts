import { api } from '../../../services/api';
import { ApiResponse } from '../../../types/api.types';
import {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  ChangePasswordData,
  ResetPasswordData,
  User,
} from '../../../types/auth.types';

export const authService = {
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return response.data.data;
  },

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    return response.data.data;
  },

  async loginWithGoogle(data: { idToken?: string; code?: string; redirectUri?: string; inviteToken?: string }): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/google', data);
    return response.data.data;
  },

  async logout(): Promise<void> {
    const refreshToken = localStorage.getItem('teamflow_refresh_token');
    try {
      await api.post('/auth/logout', { refreshToken });
    } catch {
      // Ignore network or token expiration errors on logout
    } finally {
      localStorage.removeItem('teamflow_user');
      localStorage.removeItem('teamflow_access_token');
      localStorage.removeItem('teamflow_refresh_token');
    }
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    return response.data.data;
  },

  async updateProfile(data: { name?: string; avatarUrl?: string }): Promise<User> {
    const response = await api.patch<ApiResponse<User>>('/users/profile', data);
    return response.data.data;
  },

  async changePassword(data: ChangePasswordData): Promise<void> {
    await api.post('/users/change-password', data);
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email });
  },

  async resetPassword(data: ResetPasswordData): Promise<void> {
    await api.post('/auth/reset-password', data);
  },

  async verifyEmail(token: string): Promise<void> {
    await api.post('/auth/verify-email', { token });
  },

  async searchUsers(query: string): Promise<User[]> {
    const response = await api.get<ApiResponse<User[]>>(`/users/search?query=${encodeURIComponent(query)}`);
    return response.data.data;
  },
};
