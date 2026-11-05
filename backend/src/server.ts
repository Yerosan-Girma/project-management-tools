import http from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { initializeSockets } from './sockets';
import { DeadlineJob } from './jobs/deadline.job';
import { logger } from './utils/logger';

async function bootstrap() {
  try {
    // 1. Connect to PostgreSQL
    await connectDatabase();

    // 2. Create Express application
    const app = createApp();

    // 3. Create HTTP Server
    const server = http.createServer(app);

    // 4. Initialize Socket.IO with WebSocket/Polling support
    initializeSockets(server);

    // 5. Start Background Deadline Scheduler
    const deadlineTimer = DeadlineJob.startScheduler(60);

    // 6. Listen on specified PORT
    server.listen(env.PORT, () => {
      logger.info(`🚀 TeamFlow Backend server running at http://localhost:${env.PORT}`);
      logger.info(`📚 Swagger API Docs available at http://localhost:${env.PORT}/api/docs`);
      logger.info(`🏥 Health check at http://localhost:${env.PORT}/health`);
    });

    // 7. Graceful Shutdown
    const shutdown = async (signal: string) => {
      logger.info(`⚠️ Received ${signal}. Starting graceful shutdown...`);
      clearInterval(deadlineTimer);

      server.close(async () => {
        logger.info('🛑 HTTP server closed.');
        await disconnectDatabase();
        logger.info('👋 Server shutdown completed.');
        process.exit(0);
      });

      // Force shutdown after 10 seconds if not closed
      setTimeout(() => {
        logger.error('⚠️ Forcefully terminating server after timeout.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error: any) {
    logger.error(`❌ Fatal server startup error: ${error.message}`);
    process.exit(1);
  }
}

bootstrap();
