import { Request, Response } from 'express';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { getEmailTransporter } from '../../config/email';
import { ApiResponse } from '../../utils/api-response';

export class SystemController {
  health = async (req: Request, res: Response): Promise<void> => {
    try {
      // Check database
      await prisma.$queryRaw`SELECT 1`;
      const dbStatus = 'healthy';

      ApiResponse.success(res, 'System is healthy', {
        status: 'ok',
        database: dbStatus,
        environment: env.NODE_ENV,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      ApiResponse.error(res, 'System unhealthy', {
        status: 'error',
        database: 'unhealthy',
        error: error.message,
      });
    }
  };

  emailConfig = async (req: Request, res: Response): Promise<void> => {
    try {
      const transporter = getEmailTransporter();

      ApiResponse.success(res, 'Email configuration status', {
        smtp_host: env.SMTP_HOST,
        smtp_user: env.SMTP_USER ? 'SET' : 'NOT SET',
        smtp_pass: env.SMTP_PASS ? 'SET' : 'NOT SET',
        mailtrap_token: env.MAILTRAP_TOKEN ? 'SET' : 'NOT SET',
        email_from: env.EMAIL_FROM,
        transporter_type: transporter ? 'configured' : 'not configured',
        environment: env.NODE_ENV,
      });
    } catch (error: any) {
      ApiResponse.error(res, 'Failed to check email configuration', {
        error: error.message,
      });
    }
  };

  testEmail = async (req: Request, res: Response): Promise<void> => {
    try {
      const { sendEmail } = await import('../../config/email');
      const result = await sendEmail({
        to: req.body.to || env.SMTP_USER || 'yerosang463@gmail.com',
        subject: 'TeamFlow Email Test',
        text: 'This is a test email from TeamFlow.',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h1 style="color: #4f46e5;">TeamFlow Email Test</h1>
            <p>This is a test email from TeamFlow.</p>
            <p>Timestamp: ${new Date().toISOString()}</p>
            <p>Environment: ${env.NODE_ENV}</p>
          </div>
        `,
      });

      if (result) {
        ApiResponse.success(res, 'Email sent successfully', {
          sent: true,
          to: req.body.to || env.SMTP_USER || 'yerosang463@gmail.com',
        });
      } else {
        ApiResponse.error(res, 'Email failed to send', {
          sent: false,
        });
      }
    } catch (error: any) {
      ApiResponse.error(res, 'Email test failed', {
        error: error.message,
      });
    }
  };
}
