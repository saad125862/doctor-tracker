import jwt from 'jsonwebtoken';
import { ZodError } from 'zod';
import { env } from '../config/env.js';
import { HttpError } from '../utils/helpers.js';

export const COOKIE_NAME = 'dt_token';

export function requireAuth(req, _res, next) {
  const header = req.headers.authorization;
  const token = req.cookies?.[COOKIE_NAME] || (header?.startsWith('Bearer ') ? header.slice(7) : null);
  if (!token) return next(new HttpError(401, 'Authentication required'));
  try {
    req.user = jwt.verify(token, env.jwtSecret);
    next();
  } catch {
    next(new HttpError(401, 'Invalid or expired token'));
  }
}

/** validate({ body, query, params }) with zod schemas; parsed values replace the originals. */
export const validate = (schemas) => (req, _res, next) => {
  try {
    if (schemas.params) req.params = schemas.params.parse(req.params);
    if (schemas.body) req.body = schemas.body.parse(req.body);
    if (schemas.query) req.validQuery = schemas.query.parse(req.query);
    next();
  } catch (e) {
    next(e);
  }
};

export function notFound(_req, _res, next) {
  next(new HttpError(404, 'Route not found'));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
    });
  }
  if (err?.status === 400 && Array.isArray(err.errors)) {
    return res.status(400).json({ message: err.message, errors: err.errors });
  }
  if (err?.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'field';
    return res.status(409).json({ message: `A record with this ${field} already exists` });
  }
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    message: status >= 500 && env.isProd ? 'Internal server error' : err.message,
    ...(err.details && { details: err.details }),
  });
}
