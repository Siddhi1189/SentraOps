import ApiResponse from '../utils/apiResponse.js';

/**
 * Role-Based Access Control (RBAC) authorization middleware
 * @param {...string} allowedRoles The roles allowed to access the route
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return ApiResponse.error(
        res,
        'UNAUTHORIZED',
        'Authentication required',
        401
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return ApiResponse.error(
        res,
        'FORBIDDEN',
        'You do not have permission to access this resource',
        403
      );
    }

    next();
  };
};

export default authorize;
