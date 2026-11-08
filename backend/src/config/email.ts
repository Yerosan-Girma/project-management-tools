import nodemailer from 'nodemailer';
import { MailtrapTransport } from 'mailtrap';
import { env } from './env';
import { logger } from '../utils/logger';

let transporter: nodemailer.Transporter | null = null;

export function getEmailTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  // 1. Prioritize SMTP (e.g. Mailtrap Sandbox or custom SMTP) when user/pass are provided
  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT || 2525,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS
      }
    });
    logger.info(`📧 SMTP Email Transporter configured with host: ${env.SMTP_HOST}`);
  } else if (env.MAILTRAP_TOKEN) {
    transporter = nodemailer.createTransport(
      MailtrapTransport({
        token: env.MAILTRAP_TOKEN,
      })
    );
    logger.info('📧 Mailtrap Email API Transporter configured successfully');
  } else {
    // Development / fallback stream transporter that logs email preview
    transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: 'windows',
      buffer: true
    });
    logger.info('📧 Email credentials not provided. Emails will be logged to console in dev mode.');
  }

  return transporter;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html: string;
  category?: string;
}

export async function sendEmail({ to, subject, text, html, category }: SendEmailOptions): Promise<boolean> {
  try {
    const transport = getEmailTransporter();
    const mailOptions: Record<string, any> = {
      from: env.EMAIL_FROM,
      to,
      subject,
      text,
      html
    };

    if (category) {
      mailOptions.category = category;
    }

    const info = await transport.sendMail(mailOptions as any);

    if (info && (info as any).message) {
      // In stream transport mode, output simulated email
      logger.info(`📨 [SIMULATED EMAIL] To: ${Array.isArray(to) ? to.join(', ') : to} | Subject: "${subject}"`);
    } else {
      logger.info(`✉️ Email successfully dispatched to: ${Array.isArray(to) ? to.join(', ') : to} (MessageId: ${info?.messageId || 'ok'})`);
    }
    return true;
  } catch (error: any) {
    // Temporary email provider failure must NOT fail database transactions
    logger.error(`❌ Failed to deliver email to ${Array.isArray(to) ? to.join(', ') : to}: ${error.message}`);
    return false;
  }
}
