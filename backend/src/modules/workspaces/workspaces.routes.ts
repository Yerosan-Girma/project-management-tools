import { Router } from 'express';
import { WorkspacesController } from './workspaces.controller';
import { authenticate } from '../../middleware/authenticate';
import { requireWorkspacePermission } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  updateMemberRoleSchema,
  transferOwnershipSchema,
} from './workspaces.schema';

const router = Router();
const controller = new WorkspacesController();

router.use(authenticate);

// Workspaces collection
router.post('/', validate({ body: createWorkspaceSchema }), asyncHandler(controller.create));
router.get('/', asyncHandler(controller.listMyWorkspaces));

// Single workspace
router.get(
  '/:workspaceId',
  requireWorkspacePermission('workspace:read'),
  asyncHandler(controller.getDetails)
);

// Workspace settings update
router.patch(
  '/:workspaceId',
  requireWorkspacePermission('workspace:update'),
  validate({ body: updateWorkspaceSchema }),
  asyncHandler(controller.update)
);

// Workspace delete / archival (Owner only)
router.delete(
  '/:workspaceId',
  requireWorkspacePermission('workspace:delete'),
  asyncHandler(controller.archive)
);

// Members management
router.get(
  '/:workspaceId/members',
  requireWorkspacePermission('workspace:members:read'),
  asyncHandler(controller.listMembers)
);

router.patch(
  '/:workspaceId/members/:memberId/role',
  requireWorkspacePermission('workspace:members:manage_roles'),
  validate({ body: updateMemberRoleSchema }),
  asyncHandler(controller.updateMemberRole)
);

router.delete(
  '/:workspaceId/members/:memberId',
  requireWorkspacePermission('workspace:members:remove'),
  asyncHandler(controller.removeMember)
);

// Ownership transfer (Owner only)
router.post(
  '/:workspaceId/transfer-ownership',
  requireWorkspacePermission('workspace:ownership:transfer'),
  validate({ body: transferOwnershipSchema }),
  asyncHandler(controller.transferOwnership)
);

export default router;
