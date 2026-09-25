import { logger } from '../utils/logger.js';

export function requestLogger(req, res, next) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, originalUrl } = req;
    const { statusCode } = res;

    logger.info({
      method,
      url: originalUrl,
      status: statusCode,
      durationMs: duration,
    });
  });

  next();
}
