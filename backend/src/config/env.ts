import path from 'path';
import dotenv from 'dotenv';
import { z } from 'zod';

// Load .env files only if NODE_ENV is not already set (e.g., by Render)
// This ensures production environment variables are not overridden
if (!process.env.NODE_ENV) {
  dotenv.config();
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
  dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().transform((val) => parseInt(val, 10)).default('5000'),
  APP_URL: z.string().default('https://project-management-tools-tee6.onrender.com').transform((val) => val.replace(/\/+$/, '')),
  FRONTEND_URL: z.string().default('https://project-management-tool-peach-xi.vercel.app').transform((val) => val.replace(/\/+$/, '')),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().optional(),

  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET must be at least 16 characters'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),
  ACCESS_TOKEN_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: z.string().default('7d'),

  REDIS_URL: z.string().optional(),

  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.string().transform((val) => (val ? parseInt(val, 10) : 587)).default('587'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional().transform((val) => (val ? val.trim().replace(/\s+/g, '') : undefined)),
  MAILTRAP_TOKEN: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_PROVIDER: z.enum(['smtp', 'mailtrap', 'resend', 'console']).default('smtp'),
  EMAIL_FROM: z.string().default('TeamFlow <noreply@teamflow.app>'),

  STORAGE_ENDPOINT: z.string().optional(),
  STORAGE_BUCKET: z.string().default('teamflow-attachments'),
  STORAGE_ACCESS_KEY: z.string().optional(),
  STORAGE_SECRET_KEY: z.string().optional(),

  GOOGLE_CLIENT_ID: z.string().optional().transform((val) => {
    if (!val) return undefined;
    const match = val.match(/([0-9]+-[a-z0-9_]+\.apps\.googleusercontent\.com)/i);
    return match ? match[1].trim() : val.trim().replace(/^["']|["']$/g, '');
  }),
  GOOGLE_CLIENT_SECRET: z.string().optional().transform((val) => {
    if (!val) return undefined;
    const match = val.match(/(GOCSPX-[a-zA-Z0-9_-]+)/);
    return match ? match[1].trim() : val.trim().replace(/^["']|["']$/g, '');
  }),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info')
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Environment validation failed:');
    console.error(result.error.format());
    process.exit(1);
  }
  return result.data;
};

export const env = parseEnv();
export type Env = z.infer<typeof envSchema>;
