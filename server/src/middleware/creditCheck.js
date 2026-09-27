import { ApiError } from '../utils/ApiError.js';

/**
 * Middleware that blocks requests if user's credit balance is 0 or negative.
 * Expects `auth` middleware to have run before it to attach req.user.
 */
export function creditCheck(req, _res, next) {
  try {
    if (!req.user) {
      throw new ApiError(401, 'UNAUTHORIZED', 'Authentication required for credit check');
    }

    // Allow mock interview simulation without deducting credits if simulation mode is flagged
    if (
      req.body?.isSimulation === true ||
      req.query?.simulation === 'true' ||
      req.headers?.['x-simulation'] === 'true'
    ) {
      return next();
    }

    const creditsRemaining = req.user.wallet?.creditsRemaining ?? 0;

    if (creditsRemaining <= 0) {
      throw new ApiError(402, 'INSUFFICIENT_CREDITS', 'Recharge to continue');
    }

    next();
  } catch (error) {
    next(error);
  }
}
