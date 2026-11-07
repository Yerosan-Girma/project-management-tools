import { Router } from 'express';
import { UsersController } from './users.controller';
import { authenticate } from '../../middleware/authenticate';
import { requirePlatformPermission } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import {
  updateProfileSchema,
  changePasswordSchema,
  updatePlatformRoleSchema,
  updateUserStatusSchema,
} from './users.schema';

const router = Router();
const controller = new UsersController();

router.use(authenticate);

// Standard user personal actions
router.patch('/profile', validate({ body: updateProfileSchema }), asyncHandler(controller.updateProfile));
router.post('/change-password', validate({ body: changePasswordSchema }), asyncHandler(controller.changePassword));
router.get('/search', asyncHandler(controller.searchUsers));

// Platform Admin User Management endpoints
router.get(
  '/',
  requirePlatformPermission('platform:users:read'),
  asyncHandler(controller.listPlatformUsers)
);

router.get(
  '/stats/overview',
  requirePlatformPermission('platform:settings:manage'),
  asyncHandler(controller.getPlatformStats)
);

router.get(
  '/:userId',
  requirePlatformPermission('platform:users:read'),
  asyncHandler(controller.getUserDetails)
);

router.patch(
  '/:userId/platform-role',
  requirePlatformPermission('platform:users:manage'),
  validate({ body: updatePlatformRoleSchema }),
  asyncHandler(controller.updatePlatformRole)
);

router.patch(
  '/:userId/status',
  requirePlatformPermission('platform:users:manage'),
  validate({ body: updateUserStatusSchema }),
  asyncHandler(controller.updateUserStatus)
);

export default router;
