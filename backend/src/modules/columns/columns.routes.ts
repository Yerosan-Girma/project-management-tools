import { Router } from 'express';
import { ColumnsController } from './columns.controller';
import { authenticate } from '../../middleware/authenticate';
import {
  requireBoardPermission,
  requireColumnPermission,
} from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import {
  createColumnSchema,
  updateColumnSchema,
  reorderColumnsSchema,
  deleteColumnSchema,
} from './columns.schema';

const router = Router();
const controller = new ColumnsController();

router.use(authenticate);

router.post(
  '/',
  validate({ body: createColumnSchema }),
  requireBoardPermission('project:columns:manage', 'boardId'),
  asyncHandler(controller.create)
);

router.post(
  '/reorder',
  validate({ body: reorderColumnsSchema }),
  requireBoardPermission('project:columns:manage', 'boardId'),
  asyncHandler(controller.reorder)
);

router.get(
  '/:columnId',
  requireColumnPermission('project:read', 'columnId'),
  asyncHandler(controller.getDetails)
);

router.patch(
  '/:columnId',
  validate({ body: updateColumnSchema }),
  requireColumnPermission('project:columns:manage', 'columnId'),
  asyncHandler(controller.update)
);

router.delete(
  '/:columnId',
  validate({ body: deleteColumnSchema }),
  requireColumnPermission('project:columns:manage', 'columnId'),
  asyncHandler(controller.delete)
);

export default router;
