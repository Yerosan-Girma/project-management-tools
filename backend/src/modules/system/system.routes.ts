import { Router } from 'express';
import { SystemController } from './system.controller';
import { authenticate } from '../../middleware/authenticate';
import { asyncHandler } from '../../utils/async-handler';

const router = Router();
const controller = new SystemController();

// Public health check
router.get('/health', asyncHandler(controller.health));

// Authenticated system checks
router.get('/email-config', authenticate, asyncHandler(controller.emailConfig));
router.post('/test-email', authenticate, asyncHandler(controller.testEmail));

export default router;
