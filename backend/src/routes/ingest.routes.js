import express from 'express';
import rateLimit from 'express-rate-limit';
import apiKeyAuth from '../middlewares/apiKeyAuth.js';
import validate from '../middlewares/validate.js';
import { ingestEventSchema } from '../controllers/validators/ingest.validators.js';
import { ingestEvent } from '../controllers/ingest.controller.js';
import ApiResponse from '../utils/apiResponse.js';

const router = express.Router();

// Per-API-key rate limiter: 100 events/minute per API key (Q4 quota)
const ingestRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 events per minute
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.apiKey?.id ? `key_${req.apiKey.id}` : req.ip;
  },
  handler: (req, res, next, options) => {
    const retryAfter = Math.ceil(options.windowMs / 1000);
    res.setHeader('Retry-After', retryAfter);
    return ApiResponse.error(
      res,
      'RATE_LIMIT_EXCEEDED',
      'Rate limit of 100 events per minute exceeded for this API key.',
      429
    );
  },
});

router.post(
  '/events',
  express.json({ limit: '100kb' }),
  apiKeyAuth,
  ingestRateLimiter,
  validate({ body: ingestEventSchema }),
  ingestEvent
);

export default router;
