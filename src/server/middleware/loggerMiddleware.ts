import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  // Skip logging for non-API routes (like Vite static assets) to reduce noise
  if (!req.originalUrl.startsWith('/api')) {
    return next();
  }

  const start = Date.now();

  // Finish event fires when response is fully sent
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Incoming Request', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: duration,
      ip: req.ip,
    });
  });

  next();
};
