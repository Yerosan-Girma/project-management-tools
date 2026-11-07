import { Router } from 'express';
import { ProjectsController } from './projects.controller';
import { authenticate } from '../../middleware/authenticate';
import {
  requireWorkspacePermission,
  requireProjectPermission,
} from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import {
  createProjectSchema,
  updateProjectSchema,
  addProjectMemberSchema,
  updateProjectMemberRoleSchema,
} from './projects.schema';

const router = Router();
const controller = new ProjectsController();

router.use(authenticate);

// Create project in workspace (requires Workspace permission)
router.post(
  '/',
  requireWorkspacePermission('workspace:projects:create'),
  validate({ body: createProjectSchema }),
  asyncHandler(controller.create)
);

// List workspace projects (accessible to workspace members)
router.get(
  '/workspace/:workspaceId',
  requireWorkspacePermission('workspace:projects:read'),
  asyncHandler(controller.listWorkspaceProjects)
);

// Get single project details (requires project:read)
router.get(
  '/:projectId',
  requireProjectPermission('project:read'),
  asyncHandler(controller.getDetails)
);

// Update project (requires project:update)
router.patch(
  '/:projectId',
  requireProjectPermission('project:update'),
  validate({ body: updateProjectSchema }),
  asyncHandler(controller.update)
);

// Archive project (requires project:delete)
router.delete(
  '/:projectId',
  requireProjectPermission('project:delete'),
  asyncHandler(controller.archive)
);

// Project Overview & Activity
router.get(
  '/:projectId/overview',
  requireProjectPermission('project:read'),
  asyncHandler(controller.getOverview)
);

router.get(
  '/:projectId/activity',
  requireProjectPermission('project:activity:read'),
  asyncHandler(controller.getActivity)
);

// Project Member Management (requires project:members:manage)
router.post(
  '/:projectId/members',
  requireProjectPermission('project:members:manage'),
  validate({ body: addProjectMemberSchema }),
  asyncHandler(controller.addMember)
);

router.patch(
  '/:projectId/members/:userId',
  requireProjectPermission('project:members:manage'),
  validate({ body: updateProjectMemberRoleSchema }),
  asyncHandler(controller.updateMemberRole)
);

router.delete(
  '/:projectId/members/:userId',
  requireProjectPermission('project:members:manage'),
  asyncHandler(controller.removeMember)
);

export default router;
