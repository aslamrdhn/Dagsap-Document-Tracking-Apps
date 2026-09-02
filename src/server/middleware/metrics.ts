import { Request, Response, NextFunction } from 'express';
import { redisClient } from '../redis';

export const metricsMiddleware = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      const isError = res.statusCode >= 500;

      if (process.env.NODE_ENV !== 'test' && redisClient.status === 'ready') {
        // Run completely asynchronously to not block
        redisClient.incr('metrics:totalRequests').catch(console.error);
        redisClient.incrby('metrics:totalResponseTimeMs', duration).catch(console.error);
        if (isError) {
          redisClient.incr('metrics:totalErrors').catch(console.error);
        }
      }
    });

    next();
  };
};
