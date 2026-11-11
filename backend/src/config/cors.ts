import cors, { CorsOptions } from 'cors';
import { env } from './env';

const configuredOrigins = (env.FRONTEND_URL || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const allowedOrigins = [
  ...configuredOrigins,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173'
];

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., mobile apps, curl, server-to-server)
    if (!origin) {
      return callback(null, true);
    }

    // Direct match against configured origins or localhost
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Allow any preview/production Vercel domain
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }

    callback(new Error(`CORS blocked request from origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
};

export const corsMiddleware = cors(corsOptions);
