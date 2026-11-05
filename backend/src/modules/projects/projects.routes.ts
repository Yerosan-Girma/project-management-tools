import { Router } from 'express';
import { ProjectsController } from './projects.controller';
import { authenticate } from '../../middleware/authenticate';
import { requireProjectRole, requireWorkspaceRole } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import { ProjectRole, WorkspaceRole } from '../../constants/roles';
import {
  createProjectSchema,
  updateProjectSchema,
  addProjectMemberSchema,
  updateProjectMemberRoleSchema
} from './projects.schema';

const router = Router();
const controller = new ProjectsController();

router.use(authenticate);

// Create project in workspace (requires Workspace ADMIN or OWNER)
router.post(
  '/',
  validate({ body: createProjectSchema }),
  requireWorkspaceRole(WorkspaceRole.ADMIN),
  asyncHandler(controller.create)
);

// List workspace projects (accessible to workspace members)
router.get(
  '/workspace/:workspaceId',
  requireWorkspaceRole(WorkspaceRole.GUEST),
  asyncHandler(controller.listWorkspaceProjects)
);

// Get single project details (requires VIEWER or above)
router.get(
  '/:projectId',
  requireProjectRole(ProjectRole.VIEWER),
  asyncHandler(controller.getDetails)
);

// Update project (requires MANAGER or above)
router.patch(
  '/:projectId',
  requireProjectRole(ProjectRole.MANAGER),
  validate({ body: updateProjectSchema }),
  asyncHandler(controller.update)
);

// Archive project (requires MANAGER or above)
router.delete(
  '/:projectId',
  requireProjectRole(ProjectRole.MANAGER),
  asyncHandler(controller.archive)
);

// Project Overview & Activity
router.get(
  '/:projectId/overview',
  requireProjectRole(ProjectRole.VIEWER),
  asyncHandler(controller.getOverview)
);

router.get(
  '/:projectId/activity',
  requireProjectRole(ProjectRole.VIEWER),
  asyncHandler(controller.getActivity)
);

// Project Member Management (requires MANAGER or above)
router.post(
  '/:projectId/members',
  requireProjectRole(ProjectRole.MANAGER),
  validate({ body: addProjectMemberSchema }),
  asyncHandler(controller.addMember)
);

router.patch(
  '/:projectId/members/:userId',
  requireProjectRole(ProjectRole.MANAGER),
  validate({ body: updateProjectMemberRoleSchema }),
  asyncHandler(controller.updateMemberRole)
);

router.delete(
  '/:projectId/members/:userId',
  requireProjectRole(ProjectRole.MANAGER),
  asyncHandler(controller.removeMember)
);

export default router;
