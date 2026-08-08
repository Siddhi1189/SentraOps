import rateLimit from 'express-rate-limit';
import ApiResponse from '../utils/apiResponse.js';

// Stricter rate limit for authentication endpoints to protect against brute-force attacks
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 authentication attempts per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    return ApiResponse.error(
      res,
      'TOO_MANY_AUTH_ATTEMPTS',
      'Too many authentication attempts. Please try again after 15 minutes.',
      429
    );
  },
});

// Organization-aware rate limiter for authenticated API endpoints
const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each org/IP to 200 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Key by organization ID if user is authenticated, else fallback to client IP
    return req.user?.organizationId ? `org_${req.user.organizationId}` : req.ip;
  },
  handler: (req, res) => {
    return ApiResponse.error(
      res,
      'TOO_MANY_REQUESTS',
      'Rate limit exceeded. Please reduce request frequency.',
      429
    );
  },
});

export { authRateLimiter, apiRateLimiter };
export default {
  authRateLimiter,
  apiRateLimiter,
};
