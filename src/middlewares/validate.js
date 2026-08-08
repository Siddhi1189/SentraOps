/**
 * Zod validation middleware for Express routes
 * @param {Object} schemas Object containing Zod schemas for body, query, or params
 * @param {z.Schema} [schemas.body] Zod schema for req.body
 * @param {z.Schema} [schemas.query] Zod schema for req.query
 * @param {z.Schema} [schemas.params] Zod schema for req.params
 */
const validate = (schemas) => (req, res, next) => {
  try {
    if (schemas.body) {
      req.body = schemas.body.parse(req.body);
    }
    if (schemas.query) {
      req.query = schemas.query.parse(req.query);
    }
    if (schemas.params) {
      req.params = schemas.params.parse(req.params);
    }
    next();
  } catch (err) {
    next(err);
  }
};

export default validate;
