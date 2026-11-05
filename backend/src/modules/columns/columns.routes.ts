import { Router } from 'express';
import { ColumnsController } from './columns.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import {
  createColumnSchema,
  updateColumnSchema,
  reorderColumnsSchema,
  deleteColumnSchema
} from './columns.schema';

const router = Router();
const controller = new ColumnsController();

router.use(authenticate);

router.post('/', validate({ body: createColumnSchema }), asyncHandler(controller.create));
router.post('/reorder', validate({ body: reorderColumnsSchema }), asyncHandler(controller.reorder));
router.get('/:columnId', asyncHandler(controller.getDetails));
router.patch('/:columnId', validate({ body: updateColumnSchema }), asyncHandler(controller.update));
router.delete('/:columnId', validate({ body: deleteColumnSchema }), asyncHandler(controller.delete));

export default router;
