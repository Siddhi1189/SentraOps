import { verifyAccessToken } from '../utils/jwt.js';
import ApiResponse from '../utils/apiResponse.js';

/**
 * Authentication middleware that verifies JWT access token
 */
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return ApiResponse.error(
      res,
      'UNAUTHORIZED',
      'Access token is missing or malformed',
      401
    );
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyAccessToken(token);

  if (!decoded) {
    return ApiResponse.error(
      res,
      'UNAUTHORIZED',
      'Access token is invalid or expired',
      401
    );
  }

  // Attach token payload info to request
  req.user = {
    id: decoded.userId,
    organizationId: decoded.organizationId,
    role: decoded.role,
  };

  next();
};

export default authenticate;
