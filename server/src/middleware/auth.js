import { verifyAccessToken } from '../utils/token.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/User.js';

/**
 * Authentication middleware that verifies JWT access token from Authorization header.
 * Attaches the authenticated user to req.user.
 */
export async function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Authentication token required');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Authentication token missing');
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new ApiError(401, 'TOKEN_EXPIRED', 'Access token has expired');
      }
      throw new ApiError(401, 'INVALID_TOKEN', 'Invalid access token');
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      throw new ApiError(401, 'USER_NOT_FOUND', 'User belonging to this token no longer exists');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
