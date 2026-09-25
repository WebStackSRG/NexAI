import { ApiError } from '../utils/ApiError.js';

/**
 * Role authorization middleware factory
 * @param  {...string} allowedRoles
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'UNAUTHORIZED', 'Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ApiError(403, 'FORBIDDEN', 'Insufficient permissions to access this resource'),
      );
    }

    next();
  };
}
