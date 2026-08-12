import logger from '../utils/logger.js';

/**
 * Enhanced request logger middleware that outputs structured log metadata
 * including correlation ID (X-Request-ID), organizationId, userId, statusCode, responseTime.
 */
function requestLogger(req, res, next) {
  const startTime = Date.now();

  res.on('finish', () => {
    const responseTimeMs = Date.now() - startTime;
    const organizationId = req.user?.organizationId || 'unauthenticated';
    const userId = req.user?.id || 'anonymous';
    const requestId = req.id || req.headers['x-request-id'] || 'unknown';

    logger.http(`${req.method} ${req.originalUrl || req.url} ${res.statusCode} ${responseTimeMs}ms`, {
      requestId,
      organizationId,
      userId,
      statusCode: res.statusCode,
      responseTimeMs,
    });
  });

  next();
}

export default requestLogger;
