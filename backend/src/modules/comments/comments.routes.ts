import { Router } from 'express';
import { CommentsController } from './comments.controller';
import { authenticate } from '../../middleware/authenticate';
import { requireTaskPermission } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import { createCommentSchema, updateCommentSchema } from './comments.schema';

const router = Router();
const controller = new CommentsController();

// Task-nested comment routes
router.post(
  '/tasks/:taskId/comments',
  authenticate,
  requireTaskPermission('task:comments:create', 'taskId'),
  validate({ body: createCommentSchema }),
  asyncHandler(controller.create)
);

router.get(
  '/tasks/:taskId/comments',
  authenticate,
  requireTaskPermission('task:comments:read', 'taskId'),
  asyncHandler(controller.listTaskComments)
);

// Direct comment actions (Author / Manager checked in service)
router.patch(
  '/comments/:commentId',
  authenticate,
  validate({ body: updateCommentSchema }),
  asyncHandler(controller.update)
);

router.delete(
  '/comments/:commentId',
  authenticate,
  asyncHandler(controller.delete)
);

export default router;
