import { v4 as  uuidv4 } from 'uuid';

/**
 * Middleware that ensures every incoming HTTP request has a unique correlation ID (X-Request-ID)
 */
function correlationIdMiddleware(req, res, next) {
  const requestId = req.headers['x-request-id'] || uuidv4();
  req.id = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
}

export default correlationIdMiddleware;
