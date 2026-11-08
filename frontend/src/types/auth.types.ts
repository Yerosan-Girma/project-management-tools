export type PlatformRole = 'PLATFORM_ADMIN' | 'USER';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  platformRole: PlatformRole;
  status: UserStatus;
  emailVerifiedAt?: string | null;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: string;
}

export interface AuthResponseData {
  user: User;
  tokens: AuthTokens;
  joinedWorkspace?: any;
  assignedRole?: string;
}

export type AuthResponse = AuthResponseData;

export interface LoginCredentials {
  email: string;
  password: string;
}

export type LoginInput = LoginCredentials;

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  inviteToken?: string;
}

export type RegisterInput = RegisterData;

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export type ChangePasswordInput = ChangePasswordData;

export interface ResetPasswordData {
  token: string;
  password: string;
}

export type ResetPasswordInput = ResetPasswordData;

export interface SessionInfo {
  id: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
  expiresAt: string;
  isCurrent?: boolean;
}
