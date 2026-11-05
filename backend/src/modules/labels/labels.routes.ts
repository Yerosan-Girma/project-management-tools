import { Router } from 'express';
import { LabelsController } from './labels.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import { createLabelSchema, updateLabelSchema } from './labels.schema';

const router = Router();
const controller = new LabelsController();

router.use(authenticate);

router.post('/', validate({ body: createLabelSchema }), asyncHandler(controller.create));
router.get('/workspace/:workspaceId', asyncHandler(controller.listWorkspaceLabels));
router.patch('/:labelId', validate({ body: updateLabelSchema }), asyncHandler(controller.update));
router.delete('/:labelId', asyncHandler(controller.delete));

export default router;
