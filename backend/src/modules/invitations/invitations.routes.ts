import { Router } from 'express';
import { InvitationsController } from './invitations.controller';
import { authenticate } from '../../middleware/authenticate';
import { requireWorkspacePermission } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import { inviteMemberSchema, respondInvitationSchema } from './invitations.schema';

const router = Router();
const controller = new InvitationsController();

// Public invitation verification endpoint
router.get('/details/:token', asyncHandler(controller.getDetails));
router.get('/details', asyncHandler(controller.getDetails));

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
  requireWorkspacePermission('workspace:members:invite'),
  validate({ body: inviteMemberSchema }),
  asyncHandler(controller.invite)
);

router.get(
  '/workspaces/:workspaceId',
  authenticate,
  requireWorkspacePermission('workspace:members:read'),
  asyncHandler(controller.listWorkspaceInvitations)
);

router.delete(
  '/workspaces/:workspaceId/:invitationId',
  authenticate,
  requireWorkspacePermission('workspace:members:invite'),
  asyncHandler(controller.cancel)
);

router.post(
  '/workspaces/:workspaceId/:invitationId/resend',
  authenticate,
  requireWorkspacePermission('workspace:members:invite'),
  asyncHandler(controller.resend)
);

export default router;
