import { Request, Response, NextFunction } from 'express';

interface WindowEntry {
  count: number;
  resetAt: number;
}

// Simple in-memory sliding-window rate limiter
// For production, swap with redis-based solution
const windows = new Map<string, WindowEntry>();

const cleanup = () => {
  const now = Date.now();
  for (const [key, entry] of windows.entries()) {
    if (entry.resetAt < now) windows.delete(key);
  }
};

// Clean up stale entries every 5 minutes
setInterval(cleanup, 5 * 60 * 1000);

export const createRateLimiter = (options: {
  windowMs: number;   // window duration in ms
  max: number;        // max requests per window
  keyFn?: (req: Request) => string;
}) => {
  const { windowMs, max, keyFn } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const key = keyFn
      ? keyFn(req)
      : `${req.ip}:${req.path}`;

    const now = Date.now();
    const entry = windows.get(key);

    if (!entry || entry.resetAt < now) {
      windows.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (entry.count >= max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({
        success: false,
        error: 'Too many requests. Please try again later.',
        retryAfter,
      });
    }

    entry.count++;
    return next();
  };
};

// Pre-configured limiters
export const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  keyFn: req => `auth:${req.ip}`,
});

export const apiLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  keyFn: req => `api:${req.ip}`,
});
