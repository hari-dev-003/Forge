import { ForbiddenError, UnauthorizedError } from '../lib/errors.js';

/**
 * Restrict a route to one or more roles.
 *
 * The message names the caller's own role and what was required: a bare
 * "Forbidden" made a role mismatch (see cognitoAuth.verify) impossible to
 * diagnose from the browser console. This only reveals the caller's own
 * identity back to them, so it leaks nothing.
 */
export const authorize = (...roles) => (req, _res, next) => {
  if (!req.user) return next(new UnauthorizedError());
  if (roles.length && !roles.includes(req.user.role)) {
    return next(
      new ForbiddenError(
        `This action requires the ${roles.join(' or ')} role — your account is signed in as ${req.user.role}.`
      )
    );
  }
  next();
};

export default authorize;
