import { Router } from 'express';
import { ActivitiesController } from './activities.controller';
import { authenticate } from '../../middleware/authenticate';
import { requireWorkspaceRole, requireProjectRole } from '../../middleware/authorize';
import { asyncHandler } from '../../utils/async-handler';
import { WorkspaceRole, ProjectRole } from '../../constants/roles';

const router = Router();
const controller = new ActivitiesController();

router.use(authenticate);

router.get(
  '/workspaces/:workspaceId',
  requireWorkspaceRole(WorkspaceRole.GUEST),
  asyncHandler(controller.listWorkspaceActivities)
);

router.get(
  '/projects/:projectId',
  requireProjectRole(ProjectRole.VIEWER),
  asyncHandler(controller.listProjectActivities)
);

export default router;
