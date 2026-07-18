import { authProvider } from '../auth/index.js';
import { UnauthorizedError } from '../lib/errors.js';
import { asyncHandler } from '../lib/http.js';

/** Verifies the bearer token and attaches the principal to req.user. */
export const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new UnauthorizedError('Missing bearer token');
  }
  req.user = await authProvider.verify(token);
  next();
});

export default authenticate;
