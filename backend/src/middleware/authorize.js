import { ForbiddenError, UnauthorizedError } from '../lib/errors.js';

/** Restrict a route to one or more roles. */
export const authorize = (...roles) => (req, _res, next) => {
  if (!req.user) return next(new UnauthorizedError());
  if (roles.length && !roles.includes(req.user.role)) {
    return next(new ForbiddenError('You do not have access to this resource'));
  }
  next();
};

export default authorize;
