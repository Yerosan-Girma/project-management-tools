import { Router } from 'express';
import { LabelsController } from './labels.controller';
import { authenticate } from '../../middleware/authenticate';
import {
  requireWorkspacePermission,
  requireLabelPermission,
} from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import { createLabelSchema, updateLabelSchema } from './labels.schema';

const router = Router();
const controller = new LabelsController();

router.use(authenticate);

router.post(
  '/',
  validate({ body: createLabelSchema }),
  requireWorkspacePermission('workspace:labels:manage', 'workspaceId'),
  asyncHandler(controller.create)
);

router.get(
  '/workspace/:workspaceId',
  requireWorkspacePermission('workspace:read', 'workspaceId'),
  asyncHandler(controller.listWorkspaceLabels)
);

router.patch(
  '/:labelId',
  validate({ body: updateLabelSchema }),
  requireLabelPermission('workspace:labels:manage', 'labelId'),
  asyncHandler(controller.update)
);

router.delete(
  '/:labelId',
  requireLabelPermission('workspace:labels:manage', 'labelId'),
  asyncHandler(controller.delete)
);

export default router;
