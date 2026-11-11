import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { ApiResponse } from '../../utils/api-response';
import { env } from '../../config/env';

export class AuthController {
  constructor(private readonly authService: AuthService = new AuthService()) {}

  private setRefreshTokenCookie(res: Response, token: string) {
    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/v1/auth'
    });
  }

  private clearRefreshTokenCookie(res: Response) {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/api/v1/auth'
    });
  }

  register = async (req: Request, res: Response): Promise<void> => {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await this.authService.register(req.body, ip, userAgent);
    this.setRefreshTokenCookie(res, result.tokens.refreshToken);

    ApiResponse.created(res, 'User registered successfully. Verification email sent.', result);
  };

  login = async (req: Request, res: Response): Promise<void> => {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await this.authService.login(req.body, ip, userAgent);
    this.setRefreshTokenCookie(res, result.tokens.refreshToken);

    ApiResponse.success(res, 'Login successful.', result);
  };

  refresh = async (req: Request, res: Response): Promise<void> => {
    const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await this.authService.refreshTokens(rawRefreshToken, ip, userAgent);
    this.setRefreshTokenCookie(res, result.tokens.refreshToken);

    ApiResponse.success(res, 'Tokens refreshed successfully.', result);
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    const rawRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    await this.authService.logout(rawRefreshToken, req.user?.id);
    this.clearRefreshTokenCookie(res);

    ApiResponse.success(res, 'Logged out successfully.');
  };

  verifyEmail = async (req: Request, res: Response): Promise<void> => {
    await this.authService.verifyEmail(req.body.token);
    ApiResponse.success(res, 'Email verified successfully.');
  };

  forgotPassword = async (req: Request, res: Response): Promise<void> => {
    await this.authService.forgotPassword(req.body);
    ApiResponse.success(
      res,
      'If an account exists with that email, a password reset link has been dispatched.'
    );
  };

  resetPassword = async (req: Request, res: Response): Promise<void> => {
    await this.authService.resetPassword(req.body);
    this.clearRefreshTokenCookie(res);
    ApiResponse.success(res, 'Password has been reset successfully. Please log in with your new password.');
  };

  me = async (req: Request, res: Response): Promise<void> => {
    const profile = await this.authService.getCurrentUserProfile(req.user!.id);
    ApiResponse.success(res, 'Profile retrieved successfully.', profile);
  };

  getSessions = async (req: Request, res: Response): Promise<void> => {
    const sessions = await this.authService.listSessions(req.user!.id, req.user!.sessionId);
    ApiResponse.success(res, 'Active sessions retrieved successfully.', sessions);
  };

  revokeSession = async (req: Request, res: Response): Promise<void> => {
    await this.authService.revokeSession(req.user!.id, req.params.id);
    ApiResponse.success(res, 'Session revoked successfully.');
  };

  googleAuth = async (req: Request, res: Response): Promise<void> => {
    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const result = await this.authService.loginWithGoogle(req.body, ip, userAgent);
    this.setRefreshTokenCookie(res, result.tokens.refreshToken);

    ApiResponse.success(res, 'Google authentication successful.', result);
  };

  googleRedirect = async (req: Request, res: Response): Promise<void> => {
    if (!env.GOOGLE_CLIENT_ID) {
      ApiResponse.error(res, 'Google OAuth is not configured on this server.', 500);
      return;
    }

    const redirectUri = (req.query.redirect_uri as string) || `${env.APP_URL}/api/v1/auth/google/callback`;
    const state = (req.query.state as string) || '';

    const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    googleAuthUrl.searchParams.set('client_id', env.GOOGLE_CLIENT_ID);
    googleAuthUrl.searchParams.set('redirect_uri', redirectUri);
    googleAuthUrl.searchParams.set('response_type', 'code');
    googleAuthUrl.searchParams.set('scope', 'openid email profile');
    googleAuthUrl.searchParams.set('access_type', 'offline');
    googleAuthUrl.searchParams.set('prompt', 'consent');
    if (state) {
      googleAuthUrl.searchParams.set('state', state);
    }

    res.redirect(googleAuthUrl.toString());
  };

  googleCallback = async (req: Request, res: Response): Promise<void> => {
    const code = req.query.code as string;
    const error = req.query.error as string;

    if (error || !code) {
      res.redirect(`${env.FRONTEND_URL}/login?error=${encodeURIComponent(error || 'Google login cancelled.')}`);
      return;
    }

    try {
      const ip = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];
      const redirectUri = `${env.APP_URL}/api/v1/auth/google/callback`;

      const result = await this.authService.loginWithGoogle(
        { code, redirectUri },
        ip,
        userAgent
      );

      this.setRefreshTokenCookie(res, result.tokens.refreshToken);

      res.redirect(
        `${env.FRONTEND_URL}/auth/google/callback?accessToken=${encodeURIComponent(result.tokens.accessToken)}&refreshToken=${encodeURIComponent(result.tokens.refreshToken)}`
      );
    } catch (err: any) {
      res.redirect(
        `${env.FRONTEND_URL}/login?error=${encodeURIComponent(err.message || 'Google authentication failed.')}`
      );
    }
  };
}
