import { Router } from 'express';
import { BoardsController } from './boards.controller';
import { authenticate } from '../../middleware/authenticate';
import {
  requireProjectPermission,
  requireBoardPermission,
} from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import { createBoardSchema, updateBoardSchema } from './boards.schema';

const router = Router();
const controller = new BoardsController();

router.use(authenticate);

// Create board in project
router.post(
  '/',
  validate({ body: createBoardSchema }),
  requireProjectPermission('project:boards:manage', 'projectId'),
  asyncHandler(controller.create)
);

// List project boards
router.get(
  '/project/:projectId',
  requireProjectPermission('project:read', 'projectId'),
  asyncHandler(controller.listProjectBoards)
);

// Single board
router.get(
  '/:boardId',
  requireBoardPermission('project:read', 'boardId'),
  asyncHandler(controller.getDetails)
);

router.patch(
  '/:boardId',
  requireBoardPermission('project:boards:manage', 'boardId'),
  validate({ body: updateBoardSchema }),
  asyncHandler(controller.update)
);

router.delete(
  '/:boardId',
  requireBoardPermission('project:boards:manage', 'boardId'),
  asyncHandler(controller.archive)
);

export default router;
