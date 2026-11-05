import { Router } from 'express';
import { WorkspacesController } from './workspaces.controller';
import { authenticate } from '../../middleware/authenticate';
import { requireWorkspaceRole } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import { WorkspaceRole } from '../../constants/roles';
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  updateMemberRoleSchema,
  transferOwnershipSchema
} from './workspaces.schema';

const router = Router();
const controller = new WorkspacesController();

router.use(authenticate);

// Workspaces collection
router.post('/', validate({ body: createWorkspaceSchema }), asyncHandler(controller.create));
router.get('/', asyncHandler(controller.listMyWorkspaces));

// Single workspace (require GUEST or above)
router.get('/:workspaceId', requireWorkspaceRole(WorkspaceRole.GUEST), asyncHandler(controller.getDetails));

// Workspace management (require ADMIN or OWNER)
router.patch(
  '/:workspaceId',
  requireWorkspaceRole(WorkspaceRole.ADMIN),
  validate({ body: updateWorkspaceSchema }),
  asyncHandler(controller.update)
);

// Workspace archival (require OWNER)
router.delete(
  '/:workspaceId',
  requireWorkspaceRole(WorkspaceRole.OWNER),
  asyncHandler(controller.archive)
);

// Members management
router.get(
  '/:workspaceId/members',
  requireWorkspaceRole(WorkspaceRole.GUEST),
  asyncHandler(controller.listMembers)
);

router.patch(
  '/:workspaceId/members/:memberId/role',
  requireWorkspaceRole(WorkspaceRole.ADMIN),
  validate({ body: updateMemberRoleSchema }),
  asyncHandler(controller.updateMemberRole)
);

router.delete(
  '/:workspaceId/members/:memberId',
  requireWorkspaceRole(WorkspaceRole.ADMIN),
  asyncHandler(controller.removeMember)
);

// Ownership transfer (require OWNER)
router.post(
  '/:workspaceId/transfer-ownership',
  requireWorkspaceRole(WorkspaceRole.OWNER),
  validate({ body: transferOwnershipSchema }),
  asyncHandler(controller.transferOwnership)
);

export default router;
