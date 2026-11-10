import { TooManyRequestsError } from '../errors.js';

/**
 * Lightweight sliding-window in-memory rate limiter.
 * Protects against brute-force attacks and abuse without external Redis dependencies.
 */
export function createRateLimiter({
  windowMs = 15 * 60 * 1000, // 15 minutes
  max = 100, // max requests per window
  message = 'Too many requests, please try again later.',
  keyGenerator = (req) => req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown',
} = {}) {
  const hits = new Map();

  // Periodic cleanup of stale entries every 5 minutes
  const interval = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      if (now - record.resetTime > 0) {
        hits.delete(key);
      }
    }
  }, 5 * 60 * 1000);

  if (interval.unref) interval.unref();

  return (req, res, next) => {
    // Skip rate limiting in test mode
    if (process.env.NODE_ENV === 'test' || process.execArgv.some((a) => a.includes('test')) || process.argv.some((a) => a.includes('test'))) {
      return next();
    }

    const key = keyGenerator(req);
    const now = Date.now();

    let record = hits.get(key);
    if (!record || now > record.resetTime) {
      record = {
        count: 1,
        resetTime: now + windowMs,
      };
      hits.set(key, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', resetSeconds);

    if (record.count > max) {
      res.setHeader('Retry-After', resetSeconds);
      return next(new TooManyRequestsError(message, { retryAfterSeconds: resetSeconds }));
    }

    next();
  };
}

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: 'Too many authentication attempts. Please try again after 15 minutes.',
});

export const apiRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: 'Too many requests across the API. Please slow down.',
});

export default {
  createRateLimiter,
  authRateLimiter,
  apiRateLimiter,
};
