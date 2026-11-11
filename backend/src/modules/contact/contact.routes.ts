import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/async-handler';
import { ApiResponse } from '../../utils/api-response';
import { ErrorCode } from '../../utils/app-error';
import { env } from '../../config/env';
import { contactMessageSchema } from './contact.schema';
import { contactController } from './contact.controller';

const router = Router();

// Anti-spam rate limiting: 10 messages per 15 minutes in dev/test, 5 in prod
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'production' ? 5 : 50,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    ApiResponse.error(
      res,
      'Too many contact messages sent from this network. Please wait a few minutes before trying again.',
      429,
      ErrorCode.RATE_LIMIT_EXCEEDED
    );
  },
});

router.post(
  '/',
  contactLimiter,
  validate({ body: contactMessageSchema }),
  asyncHandler(contactController.sendMessage)
);

export default router;
