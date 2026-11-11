import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { MailtrapTransport } from 'mailtrap';
import { env } from './env';
import { logger } from '../utils/logger';

let transporter: Transporter<any> | null = null;

export function getEmailTransporter(): Transporter<any> {
  if (transporter) return transporter;

  // 1. Prioritize SMTP (e.g. Gmail, Mailtrap Sandbox, or custom SMTP) when user/pass are provided
  const smtpUser = env.SMTP_USER?.trim();
  const smtpPass = env.SMTP_PASS?.trim().replace(/\s+/g, '');
  const smtpHost = env.SMTP_HOST?.trim() || 'smtp.gmail.com';
  const isGmail = smtpHost.toLowerCase().includes('gmail') || (smtpUser && smtpUser.toLowerCase().includes('@gmail.com'));

  if (smtpUser && smtpPass) {
    if (isGmail) {
      transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });
      logger.info(`📧 Gmail Email Transporter configured successfully for ${smtpUser}`);
    } else {
      const port = env.SMTP_PORT || 587;
      const secure = port === 465;
      transporter = nodemailer.createTransport({
        host: smtpHost,
        port,
        secure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
      logger.info(`📧 Custom SMTP Email Transporter configured for ${smtpUser} via ${smtpHost}:${port} (secure: ${secure})`);
    }
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
      buffer: true,
    });
    logger.info('📧 Email credentials not provided. Emails will be logged to console in dev mode.');
  }

  return transporter;
}

export function resetEmailTransporter(): void {
  if (transporter) {
    try {
      transporter.close();
    } catch {
      // Ignored
    }
  }
  transporter = null;
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

    // Auto-generate plain-text fallback if text is not provided to ensure high deliverability and avoid spam classification
    const plainText =
      text ||
      html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    // Strictly align RFC 5322 From address with authenticated SMTP_USER to avoid DMARC/SPF misalignment and junk delivery
    const senderAddress = env.SMTP_USER?.trim() || 'yerosang463@gmail.com';
    const senderName = 'TeamFlow';

    const mailOptions: Record<string, any> = {
      from: {
        name: senderName,
        address: senderAddress,
      },
      replyTo: senderAddress,
      to,
      subject,
      text: plainText,
      html,
      headers: {
        'X-Priority': '3',
        'X-Mailer': 'TeamFlow App Mailer',
        'List-Unsubscribe': `<mailto:${senderAddress}?subject=unsubscribe>`,
      },
    };

    if (category) {
      mailOptions.category = category;
    }

    // Add timeout to prevent hanging on slow email servers
    const info = await Promise.race([
      transport.sendMail(mailOptions as any),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Email send timeout after 10 seconds')), 10000)
      ),
    ]) as any;

    if (info && (info as any).message) {
      // In stream transport mode, output simulated email
      logger.info(`📨 [SIMULATED EMAIL] To: ${Array.isArray(to) ? to.join(', ') : to} | Subject: "${subject}"`);
    } else {
      logger.info(`✉️ Email successfully dispatched to: ${Array.isArray(to) ? to.join(', ') : to} (MessageId: ${info?.messageId || 'ok'})`);
    }
    return true;
  } catch (error: any) {
    // Reset transporter on connection/auth errors so subsequent attempts can reconnect fresh
    resetEmailTransporter();
    logger.error(`❌ Failed to deliver email to ${Array.isArray(to) ? to.join(', ') : to}: ${error.message}`);
    return false;
  }
}
