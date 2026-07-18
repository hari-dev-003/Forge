import { AppError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';

/** 404 fallthrough. */
export function notFound(req, res) {
  res.status(404).json({
    success: false,
    error: { code: 'NOT_FOUND', message: `Route not found: ${req.method} ${req.originalUrl}` },
  });
}

/** Central error handler — maps AppError -> HTTP; hides internals otherwise. */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) logger.error(err.message, { stack: err.stack });
    return res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message, ...(err.details ? { details: err.details } : {}) },
    });
  }
  logger.error('Unhandled error', { message: err.message, stack: err.stack });
  res.status(500).json({
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
  });
}
