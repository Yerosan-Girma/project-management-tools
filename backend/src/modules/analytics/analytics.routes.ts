import { Router } from 'express';
import { AnalyticsController } from './analytics.controller';
import { authenticate } from '../../middleware/authenticate';
import { requireProjectRole } from '../../middleware/authorize';
import { asyncHandler } from '../../utils/async-handler';
import { ProjectRole } from '../../constants/roles';

const router = Router();
const controller = new AnalyticsController();

router.use(authenticate);

// User high-level dashboard metrics
router.get('/dashboard', asyncHandler(controller.getDashboardStats));

// Project-specific metrics & reports
router.get(
  '/projects/:projectId',
  requireProjectRole(ProjectRole.VIEWER),
  asyncHandler(controller.getProjectAnalytics)
);

router.get(
  '/projects/:projectId/activity',
  requireProjectRole(ProjectRole.VIEWER),
  asyncHandler(controller.getProjectActivity)
);

router.get(
  '/projects/:projectId/reports',
  requireProjectRole(ProjectRole.VIEWER),
  asyncHandler(controller.getProjectReports)
);

export default router;
