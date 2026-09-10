/**
 * Generic Zod validation middleware
 * Validates req.body, req.params, and/or req.query
 */
export const validate = (schema) => (req, res, next) => {
  try {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      return res.status(400).json({
        error: "Validation failed",
        details: result.error.flatten(),
      });
    }

    // Assign sanitized/parsed values
    if (result.data.body) req.body = result.data.body;
    if (result.data.params) req.params = result.data.params;
    if (result.data.query) req.query = result.data.query;

    next();
  } catch (err) {
    return res.status(400).json({
      error: "Malformed request data",
      details: err.message,
    });
  }
};

export default validate;
