import { Router } from 'express';
import { TasksController } from './tasks.controller';
import { authenticate } from '../../middleware/authenticate';
import { requireProjectRole } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import { ProjectRole } from '../../constants/roles';
import {
  createTaskSchema,
  updateTaskSchema,
  moveTaskSchema,
  assignUsersSchema,
  taskLabelsSchema
} from './tasks.schema';

const router = Router();
const controller = new TasksController();

router.use(authenticate);

// List my assigned tasks across all projects
router.get('/my-assigned', asyncHandler(controller.listMyTasks));

// Project-specific task collection
router.post(
  '/',
  validate({ body: createTaskSchema }),
  asyncHandler(controller.create)
);

router.get(
  '/project/:projectId',
  requireProjectRole(ProjectRole.VIEWER),
  asyncHandler(controller.listProjectTasks)
);

// Single task endpoints
router.get('/:taskId', asyncHandler(controller.getDetails));
router.patch('/:taskId', validate({ body: updateTaskSchema }), asyncHandler(controller.update));
router.post('/:taskId/move', validate({ body: moveTaskSchema }), asyncHandler(controller.move));
router.post('/:taskId/assign', validate({ body: assignUsersSchema }), asyncHandler(controller.assignUsers));
router.delete('/:taskId/assignees/:userId', asyncHandler(controller.unassignUser));
router.put('/:taskId/labels', validate({ body: taskLabelsSchema }), asyncHandler(controller.setLabels));
router.delete('/:taskId', asyncHandler(controller.archive));

export default router;
