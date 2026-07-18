import { BadRequestError } from '../lib/errors.js';

/**
 * Validate a request part against a Zod schema and replace it with the parsed
 * (typed, defaulted) value. Usage: validate(schema, 'body').
 */
export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({
      path: i.path.join('.'),
      message: i.message,
    }));
    return next(new BadRequestError('Validation failed', details));
  }
  req[source] = result.data;
  next();
};

export default validate;
