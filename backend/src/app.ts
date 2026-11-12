import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { corsMiddleware } from './config/cors';
import { logger } from './utils/logger';
import { env } from './config/env';
import { generalLimiter } from './middleware/rate-limiter';
import { notFoundHandler } from './middleware/not-found';
import { errorHandler } from './middleware/error-handler';
import { openApiSpec } from './docs/openapi';

// Route imports
import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import workspacesRoutes from './modules/workspaces/workspaces.routes';
import invitationsRoutes from './modules/invitations/invitations.routes';
import projectsRoutes from './modules/projects/projects.routes';
import boardsRoutes from './modules/boards/boards.routes';
import columnsRoutes from './modules/columns/columns.routes';
import tasksRoutes from './modules/tasks/tasks.routes';
import labelsRoutes from './modules/labels/labels.routes';
import commentsRoutes from './modules/comments/comments.routes';
import notificationsRoutes from './modules/notifications/notifications.routes';
import activitiesRoutes from './modules/activities/activities.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';
import contactRoutes from './modules/contact/contact.routes';
import systemRoutes from './modules/system/system.routes';

export function createApp(): Application {
  const app = express();

  // 0. Trust proxy headers for Render/Cloudflare (required for rate limiter to work correctly)
  // In production, trust the proxy chain (Render + Cloudflare)
  app.set('trust proxy', env.NODE_ENV === 'production' ? 2 : false);

  // 1. Security HTTP Headers
  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false
    })
  );

  // 2. Strict CORS
  app.use(corsMiddleware);

  // 3. Body & Cookie Parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // 4. Request Logging (skip in test environment)
  if (env.NODE_ENV !== 'test') {
    app.use(
      pinoHttp({
        logger,
        autoLogging: {
          ignore: (req) => req.url === '/health' || Boolean(req.url?.startsWith('/api/docs'))
        }
      })
    );
  }

  // 5. General Rate Limiter (skip in test environment)
  if (env.NODE_ENV !== 'test') {
    app.use('/api', generalLimiter);
  }

  // 6. Swagger API Documentation
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));
  app.get('/api/docs.json', (_req: Request, res: Response) => {
    res.json(openApiSpec);
  });

  // 7. Health Check
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: env.NODE_ENV
    });
  });

  // 8. REST API v1 Routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', usersRoutes);
  app.use('/api/v1/workspaces', workspacesRoutes);
  app.use('/api/v1/invitations', invitationsRoutes);
  app.use('/api/v1/projects', projectsRoutes);
  app.use('/api/v1/boards', boardsRoutes);
  app.use('/api/v1/columns', columnsRoutes);
  app.use('/api/v1/tasks', tasksRoutes);
  app.use('/api/v1/labels', labelsRoutes);
  app.use('/api/v1', commentsRoutes); // Handles /api/v1/tasks/:taskId/comments and /api/v1/comments/:commentId
  app.use('/api/v1/notifications', notificationsRoutes);
  app.use('/api/v1/activities', activitiesRoutes);
  app.use('/api/v1/analytics', analyticsRoutes);
  app.use('/api/v1/contact', contactRoutes);
  app.use('/api/v1/system', systemRoutes);

  // 9. 404 Handler
  app.use(notFoundHandler);

  // 10. Centralized Error Handler
  app.use(errorHandler);

  return app;
}
