/**
 * Wraps an async route handler or controller to forward errors to the next middleware.
 * @param {Function} fn
 * @returns {Function}
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
