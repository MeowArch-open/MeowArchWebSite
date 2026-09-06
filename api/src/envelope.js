/**
 * Unified response envelope:
 *   { "code": 0, "message": "success", "data": ... }   on success
 *   { "code": <http-status>, "message": "...", "data": null }  on failure
 */
export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function ok(res, data = null, status = 200) {
  return res.status(status).json({ code: 0, message: "success", data });
}

export function fail(res, status, message, data = null) {
  return res.status(status).json({ code: status, message, data });
}

/** Wrap async route handlers so rejections reach the error middleware. */
export const wrap = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
