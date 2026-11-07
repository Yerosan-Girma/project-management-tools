import { Router } from 'express';
import { TasksController } from './tasks.controller';
import { authenticate } from '../../middleware/authenticate';
import {
  requireProjectPermission,
  requireTaskPermission,
} from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import {
  createTaskSchema,
  updateTaskSchema,
  moveTaskSchema,
  assignUsersSchema,
  taskLabelsSchema,
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
  requireProjectPermission('project:tasks:create', 'projectId'),
  asyncHandler(controller.create)
);

router.get(
  '/project/:projectId',
  requireProjectPermission('project:tasks:read', 'projectId'),
  asyncHandler(controller.listProjectTasks)
);

// Single task endpoints with granular PBAC enforcement
router.get(
  '/:taskId',
  requireTaskPermission('task:read'),
  asyncHandler(controller.getDetails)
);

router.patch(
  '/:taskId',
  requireTaskPermission('task:update'),
  validate({ body: updateTaskSchema }),
  asyncHandler(controller.update)
);

router.post(
  '/:taskId/move',
  requireTaskPermission('task:move'),
  validate({ body: moveTaskSchema }),
  asyncHandler(controller.move)
);

router.post(
  '/:taskId/assign',
  requireTaskPermission('task:assign'),
  validate({ body: assignUsersSchema }),
  asyncHandler(controller.assignUsers)
);

router.delete(
  '/:taskId/assignees/:userId',
  requireTaskPermission('task:assign'),
  asyncHandler(controller.unassignUser)
);

router.put(
  '/:taskId/labels',
  requireTaskPermission('task:labels:manage'),
  validate({ body: taskLabelsSchema }),
  asyncHandler(controller.setLabels)
);

router.delete(
  '/:taskId',
  requireTaskPermission('task:delete'),
  asyncHandler(controller.archive)
);

export default router;
