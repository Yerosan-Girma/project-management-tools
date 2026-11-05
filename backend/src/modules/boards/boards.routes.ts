import { Router } from 'express';
import { BoardsController } from './boards.controller';
import { authenticate } from '../../middleware/authenticate';
import { requireProjectRole } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import { ProjectRole } from '../../constants/roles';
import { createBoardSchema, updateBoardSchema } from './boards.schema';

const router = Router();
const controller = new BoardsController();

router.use(authenticate);

// Create board in project
router.post(
  '/',
  validate({ body: createBoardSchema }),
  requireProjectRole(ProjectRole.MANAGER),
  asyncHandler(controller.create)
);

// List project boards
router.get(
  '/project/:projectId',
  requireProjectRole(ProjectRole.VIEWER),
  asyncHandler(controller.listProjectBoards)
);

// Single board
router.get(
  '/:boardId',
  asyncHandler(controller.getDetails)
);

router.patch(
  '/:boardId',
  validate({ body: updateBoardSchema }),
  asyncHandler(controller.update)
);

router.delete(
  '/:boardId',
  asyncHandler(controller.archive)
);

export default router;
