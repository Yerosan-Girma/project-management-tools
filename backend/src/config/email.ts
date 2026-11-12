import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { MailtrapClient } from 'mailtrap';
import { env } from './env';
import { logger } from '../utils/logger';

let transporter: Transporter<any> | null = null;
let mailtrapClient: MailtrapClient | null = null;
let isSimulatedTransport = false;

export function getEmailTransporter(): Transporter<any> {
  if (transporter) return transporter;

  switch (env.EMAIL_PROVIDER) {
    case 'smtp': {
      const smtpUser = env.SMTP_USER?.trim();
      const smtpPass = env.SMTP_PASS?.trim().replace(/\s+/g, '');
      if (Boolean(smtpUser) !== Boolean(smtpPass)) {
        throw new Error('Both SMTP_USER and SMTP_PASS must be configured to send email through SMTP.');
      }
      if (!smtpUser || !smtpPass) {
        throw new Error('SMTP email provider requires SMTP_USER and SMTP_PASS.');
      }

      const port = env.SMTP_PORT;
      transporter = nodemailer.createTransport({
        host: env.SMTP_HOST.trim(),
        port,
        secure: port === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });
      logger.info(`📧 SMTP email transport configured via ${env.SMTP_HOST}:${port}`);
      break;
    }
    case 'mailtrap': {
      if (!env.MAILTRAP_TOKEN) {
        throw new Error('Mailtrap email provider requires MAILTRAP_TOKEN.');
      }
      // Use Mailtrap SDK for proper API integration
      mailtrapClient = new MailtrapClient({
        token: env.MAILTRAP_TOKEN,
      });
      logger.info('📧 Mailtrap Email API Client configured successfully');
      break;
    }
    case 'resend': {
      if (!env.RESEND_API_KEY) {
        throw new Error('Resend email provider requires RESEND_API_KEY.');
      }
      transporter = nodemailer.createTransport({
        host: 'smtp.resend.com',
        port: 465,
        secure: true,
        auth: { user: 'resend', pass: env.RESEND_API_KEY },
      });
      logger.info('📧 Resend SMTP transport configured successfully');
      break;
    }
    case 'console': {
      if (env.NODE_ENV === 'production') {
        throw new Error('The console email provider cannot be used in production.');
      }
      transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: 'windows',
        buffer: true,
      });
      isSimulatedTransport = true;
      logger.warn('⚠️ Console email provider is enabled; messages will not be delivered.');
      break;
    }
  }

  // For mailtrap, we don't use nodemailer transporter
  if (env.EMAIL_PROVIDER !== 'mailtrap' && !transporter) {
    throw new Error(`Unsupported email provider: ${env.EMAIL_PROVIDER}`);
  }

  return transporter!;
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
  mailtrapClient = null;
  isSimulatedTransport = false;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html: string;
  category?: string;
}

export async function sendEmail({ to, subject, text, html, category }: SendEmailOptions): Promise<{ emailSent: boolean; errorMessage?: string }> {
  try {
    // Handle Mailtrap API using SDK
    if (env.EMAIL_PROVIDER === 'mailtrap') {
      if (!mailtrapClient) {
        mailtrapClient = new MailtrapClient({ token: env.MAILTRAP_TOKEN! });
      }

      const configuredSender = env.EMAIL_FROM.match(/<([^>]+)>/)?.[1] || env.EMAIL_FROM.trim();
      const senderName = 'TeamFlow';

      const plainText =
        text ||
        html
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

      const recipients = Array.isArray(to) ? to.map(email => ({ email })) : [{ email: to }];

      const mailOptions: any = {
        from: {
          email: configuredSender,
          name: senderName,
        },
        to: recipients,
        subject,
        text: plainText,
        html,
      };

      if (category) {
        mailOptions.category = category;
      }

      const response = await mailtrapClient.send(mailOptions);

      logger.info(`✉️ Email successfully dispatched via Mailtrap to: ${Array.isArray(to) ? to.join(', ') : to} (MessageIds: ${response.message_ids?.join(', ') || 'ok'})`);
      return { emailSent: true };
    }

    // Handle other providers using nodemailer
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
    const configuredSender = env.EMAIL_FROM.match(/<([^>]+)>/)?.[1] || env.EMAIL_FROM.trim();
    const senderAddress = env.EMAIL_PROVIDER === 'smtp'
      ? env.SMTP_USER?.trim() || configuredSender
      : configuredSender;
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

    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(() => reject(new Error('Email send timeout after 60 seconds')), 60000);
    });
    let info: any;
    try {
      info = await Promise.race([transport.sendMail(mailOptions as any), timeout]);
    } finally {
      if (timeoutHandle) clearTimeout(timeoutHandle);
    }

    if (isSimulatedTransport) {
      logger.warn(`📨 [SIMULATED EMAIL NOT SENT] To: ${Array.isArray(to) ? to.join(', ') : to} | Subject: "${subject}"`);
      return { emailSent: false };
    }

    logger.info(`✉️ Email successfully dispatched to: ${Array.isArray(to) ? to.join(', ') : to} (MessageId: ${info?.messageId || 'ok'})`);
    return { emailSent: true };
  } catch (error: any) {
    // Reset transporter on connection/auth errors so subsequent attempts can reconnect fresh
    resetEmailTransporter();
    const errorMessage = error.message || 'Unknown error';
    logger.error(`❌ Failed to deliver email to ${Array.isArray(to) ? to.join(', ') : to}: ${errorMessage}`);
    return { emailSent: false, errorMessage };
  }
}
