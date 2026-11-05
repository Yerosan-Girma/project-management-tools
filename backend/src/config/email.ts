import nodemailer from 'nodemailer';
import { env } from './env';
import { logger } from '../utils/logger';

let transporter: nodemailer.Transporter | null = null;

export function getEmailTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  if (env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT || 587,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS
      }
    });
    logger.info(`📧 SMTP Email Transporter configured with host: ${env.SMTP_HOST}`);
  } else {
    // Development / fallback stream transporter that logs email preview
    transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: 'windows',
      buffer: true
    });
    logger.info('📧 SMTP credentials not fully provided. Emails will be logged to console in dev mode.');
  }

  return transporter;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  text?: string;
  html: string;
}

export async function sendEmail({ to, subject, text, html }: SendEmailOptions): Promise<boolean> {
  try {
    const transport = getEmailTransporter();
    const info = await transport.sendMail({
      from: env.EMAIL_FROM,
      to,
      subject,
      text,
      html
    });

    if (info.message) {
      // In stream transport mode, output simulated email
      logger.info(`📨 [SIMULATED EMAIL] To: ${to} | Subject: "${subject}"`);
    } else {
      logger.info(`✉️ Email successfully dispatched to: ${to} (MessageId: ${info.messageId})`);
    }
    return true;
  } catch (error: any) {
    // Temporary email provider failure must NOT fail database transactions
    logger.error(`❌ Failed to deliver email to ${to}: ${error.message}`);
    return false;
  }
}
