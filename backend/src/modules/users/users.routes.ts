import { Router } from 'express';
import { UsersController } from './users.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import { updateProfileSchema, changePasswordSchema } from './users.schema';

const router = Router();
const controller = new UsersController();

router.use(authenticate);

router.patch('/profile', validate({ body: updateProfileSchema }), asyncHandler(controller.updateProfile));
router.post('/change-password', validate({ body: changePasswordSchema }), asyncHandler(controller.changePassword));
router.get('/search', asyncHandler(controller.searchUsers));

export default router;
