import { Router } from 'express';
import { InvitationsController } from './invitations.controller';
import { authenticate } from '../../middleware/authenticate';
import { requireWorkspaceRole } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import { WorkspaceRole } from '../../constants/roles';
import { inviteMemberSchema, respondInvitationSchema } from './invitations.schema';

const router = Router();
const controller = new InvitationsController();

// Public invitation verification endpoint
router.get('/details/:token', asyncHandler(controller.getDetails));

// Authenticated invitation acceptance/rejection
router.post(
  '/accept',
  authenticate,
  validate({ body: respondInvitationSchema }),
  asyncHandler(controller.accept)
);

router.post(
  '/reject',
  authenticate,
  validate({ body: respondInvitationSchema }),
  asyncHandler(controller.reject)
);

// Workspace-scoped invitation routes
router.post(
  '/workspaces/:workspaceId',
  authenticate,
  requireWorkspaceRole(WorkspaceRole.ADMIN),
  validate({ body: inviteMemberSchema }),
  asyncHandler(controller.invite)
);

router.get(
  '/workspaces/:workspaceId',
  authenticate,
  requireWorkspaceRole(WorkspaceRole.ADMIN),
  asyncHandler(controller.listWorkspaceInvitations)
);

router.delete(
  '/workspaces/:workspaceId/:invitationId',
  authenticate,
  requireWorkspaceRole(WorkspaceRole.ADMIN),
  asyncHandler(controller.cancel)
);

export default router;
