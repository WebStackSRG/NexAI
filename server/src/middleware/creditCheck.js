import { ApiError } from '../utils/ApiError.js';
import { systemConfigService } from '../services/systemConfig.service.js';

/**
 * Middleware that governs access based on active billingEnforcementMode:
 * - 'quota_free' (Academic/Evaluation Demo): Bypasses HTTP 402 lock when balance is 0,
 *   allowing unconstrained execution up to the Google Gemini free-tier ceiling of 1,500 RPD.
 * - 'credit_strict' (Commercial SaaS Mode): Enforces hard-stop when creditsRemaining <= 0 with 402.
 *
 * In both modes, atomic credit deduction and UsageLog telemetry remain active.
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

    // When balance is positive, permit immediately and synchronously in all modes
    if (creditsRemaining > 0) {
      return next();
    }

    // Balance is 0 or negative: check active governance enforcement mode
    const mode = systemConfigService.getBillingMode();

    if (mode === 'quota_free') {
      // In quota-free mode, verify that platform daily calls remain under the 1,500 RPD ceiling
      return systemConfigService
        .checkDailyQuota()
        .then((quotaCheck) => {
          if (!quotaCheck.allowed) {
            return next(
              new ApiError(
                429,
                'DAILY_QUOTA_EXCEEDED',
                `Daily Gemini API quota limit of ${quotaCheck.limit} requests reached. Resets at 00:00 UTC.`,
              ),
            );
          }
          next();
        })
        .catch(next);
    }

    // Strict mode: halt at 0 credits requiring recharge
    throw new ApiError(402, 'INSUFFICIENT_CREDITS', 'Recharge to continue');
  } catch (error) {
    next(error);
  }
}
