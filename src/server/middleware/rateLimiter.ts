import rateLimit from 'express-rate-limit';

/**
 * Middleware that limits public unauthenticated API endpoints (e.g., login, register)
 * to 100 requests per 15 minutes per IP to prevent brute-force attacks.
 */
export const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window`
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

/**
 * Middleware that limits protected authenticated API endpoints
 * to 500 requests per 15 minutes per IP to prevent abuse and ensure fair usage.
 */
export const protectedLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Limit each IP to 500 requests per `window`
  message: { error: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});
