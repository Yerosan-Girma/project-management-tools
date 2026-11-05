import { Router } from 'express';
import { CommentsController } from './comments.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import { createCommentSchema, updateCommentSchema } from './comments.schema';

const router = Router();
const controller = new CommentsController();

router.use(authenticate);

// Task-nested comment routes
router.post('/tasks/:taskId/comments', validate({ body: createCommentSchema }), asyncHandler(controller.create));
router.get('/tasks/:taskId/comments', asyncHandler(controller.listTaskComments));

// Direct comment actions
router.patch('/comments/:commentId', validate({ body: updateCommentSchema }), asyncHandler(controller.update));
router.delete('/comments/:commentId', asyncHandler(controller.delete));

export default router;
