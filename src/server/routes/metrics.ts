import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../db';
import { redisClient } from '../redis';
import { authenticate, requireRole } from '../middleware/authMiddleware';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /api/metrics:
 *   get:
 *     summary: Get system metrics (Super Admin only)
 *     tags: [Metrics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalRequests:
 *                   type: number
 *                 totalErrors:
 *                   type: number
 *                 averageResponseTimeMs:
 *                   type: number
 *                 activeUsers:
 *                   type: number
 */
router.get('/', requireRole(['SUPER_ADMIN']), async (req: Request, res: Response, next: NextFunction) => {
  try {
    let metrics = {
      totalRequests: 0,
      totalErrors: 0,
      averageResponseTimeMs: 0,
      activeUsers: 0
    };

    if (redisClient.status === 'ready') {
      const requests = await redisClient.get('metrics:totalRequests');
      const errors = await redisClient.get('metrics:totalErrors');
      const timeMs = await redisClient.get('metrics:totalResponseTimeMs');
      
      const reqCount = requests ? parseInt(requests, 10) : 0;
      const errCount = errors ? parseInt(errors, 10) : 0;
      const timeCount = timeMs ? parseInt(timeMs, 10) : 0;

      metrics.totalRequests = reqCount;
      metrics.totalErrors = errCount;
      metrics.averageResponseTimeMs = reqCount > 0 ? timeCount / reqCount : 0;
    }

    // Estimate active users by counting those logged in the last 15 minutes if we had a lastLogin field.
    // As a proxy, let's just count total users as active for this simple implementation.
    metrics.activeUsers = await prisma.user.count();

    res.json(metrics);
  } catch (err) {
    next(err);
  }
});

export default router;
