import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { env } from '../../src/config/env';
import { resetEmailTransporter, sendEmail } from '../../src/config/email';

const originalEnv = {
  NODE_ENV: env.NODE_ENV,
  EMAIL_PROVIDER: env.EMAIL_PROVIDER,
  SMTP_USER: env.SMTP_USER,
  SMTP_PASS: env.SMTP_PASS,
  MAILTRAP_TOKEN: env.MAILTRAP_TOKEN,
  RESEND_API_KEY: env.RESEND_API_KEY,
};

describe('Email delivery configuration', () => {
  beforeEach(() => {
    resetEmailTransporter();
    env.NODE_ENV = 'test';
    env.EMAIL_PROVIDER = 'console';
    env.SMTP_USER = undefined;
    env.SMTP_PASS = undefined;
    env.MAILTRAP_TOKEN = undefined;
    env.RESEND_API_KEY = undefined;
  });

  afterEach(() => {
    resetEmailTransporter();
    Object.assign(env, originalEnv);
  });

  it('does not report simulated email as delivered', async () => {
    const result = await sendEmail({
      to: 'invitee@example.com',
      subject: 'Invitation',
      html: '<p>Join the workspace</p>',
    });
    expect(result.emailSent).toBe(false);
  });

  it('does not simulate email in production when no provider is configured', async () => {
    env.NODE_ENV = 'production';
    env.EMAIL_PROVIDER = 'smtp';

    const result = await sendEmail({
      to: 'invitee@example.com',
      subject: 'Invitation',
      html: '<p>Join the workspace</p>',
    });
    expect(result.emailSent).toBe(false);
  });
});
