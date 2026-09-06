import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { config } from "./config.js";
import { fail } from "./envelope.js";

let devToken = null;

/** In dev mode (no ADMIN_SECRET_KEY / JWT_SECRET) a token is generated at boot. */
export function getDevToken() {
  return devToken;
}

/**
 * Resolve the active auth mode:
 *   1. ADMIN_SECRET_KEY -> static token, timing-safe string comparison
 *   2. JWT_SECRET       -> signed JWTs carrying { role: "admin" }
 *   3. development only -> auto-generated token (printed at startup)
 * Throws in production when no auth is configured (fail fast).
 */
export function resolveAuthConfig() {
  if (config.adminSecretKey)
    return { mode: "static", secret: config.adminSecretKey };
  if (config.jwtSecret) return { mode: "jwt", secret: config.jwtSecret };
  if (config.isProd) {
    throw new Error(
      "No auth configured: set ADMIN_SECRET_KEY or JWT_SECRET in production",
    );
  }
  if (!devToken) devToken = crypto.randomBytes(24).toString("hex");
  return { mode: "static", secret: devToken };
}

/** Express middleware enforcing `Authorization: Bearer <token>`. */
export function authMiddleware(req, res, next) {
  const header = req.headers.authorization || "";
  const [scheme, token, ...rest] = header.split(" ");
  if (scheme !== "Bearer" || !token || rest.length > 0) {
    return fail(res, 401, "missing or malformed Authorization header");
  }

  let cfg;
  try {
    cfg = resolveAuthConfig();
  } catch {
    return fail(res, 500, "server auth is not configured");
  }

  if (cfg.mode === "static") {
    const a = Buffer.from(token);
    const b = Buffer.from(cfg.secret);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return fail(res, 401, "invalid token");
    }
    req.auth = { mode: "static" };
    return next();
  }

  try {
    const payload = jwt.verify(token, cfg.secret);
    if (payload.role !== "admin") {
      return fail(res, 403, "insufficient permission: admin role required");
    }
    req.auth = { mode: "jwt", payload };
    return next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return fail(res, 401, "token expired");
    }
    return fail(res, 401, "invalid token");
  }
}
