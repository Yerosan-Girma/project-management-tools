import { Router } from 'express';
import { InvitationsController } from './invitations.controller';
import { authenticate } from '../../middleware/authenticate';
import { requireWorkspacePermission, requireProjectPermission } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import { inviteMemberSchema, inviteProjectMemberSchema, respondInvitationSchema } from './invitations.schema';

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

// Project-scoped invitation routes
router.post(
  '/projects/:projectId',
  authenticate,
  requireProjectPermission('project:members:manage'),
  validate({ body: inviteProjectMemberSchema }),
  asyncHandler(controller.inviteProjectMember)
);

router.get(
  '/projects/:projectId',
  authenticate,
  requireProjectPermission('project:members:read'),
  asyncHandler(controller.listProjectInvitations)
);

router.post(
  '/projects/:projectId/:invitationId/resend',
  authenticate,
  requireProjectPermission('project:members:manage'),
  asyncHandler(controller.resendProjectInvitation)
);

router.delete(
  '/projects/:projectId/:invitationId',
  authenticate,
  requireProjectPermission('project:members:manage'),
  asyncHandler(controller.cancelProjectInvitation)
);

export default router;
