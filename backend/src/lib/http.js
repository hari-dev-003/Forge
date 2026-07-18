// Small HTTP helpers so controllers stay declarative.

/** Wrap an async route handler so thrown errors reach the error middleware. */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/** Standard success envelope. */
export function ok(res, data, status = 200) {
  return res.status(status).json({ success: true, data });
}

/** Standard list envelope with optional pagination cursor. */
export function list(res, items, meta = {}) {
  return res.status(200).json({ success: true, data: items, ...meta });
}
