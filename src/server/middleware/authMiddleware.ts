import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../auth';
import { prisma } from '../db';

export interface AuthRequest extends Request {
  user?: any;
}

/**
 * Middleware that authenticates incoming requests using JWT.
 * It checks for a token in the `token` cookie or the `Authorization` header.
 * If valid, it attaches the user object (from the database) to the `req` object.
 * @param req - Express request object, extended to include user.
 * @param res - Express response object.
 * @param next - Express next function to pass control to the next middleware/handler.
 */
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const decoded: any = verifyToken(token);
  if (!decoded || !decoded.userId) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    include: { defaultLocation: true },
  });

  if (!user || !user.active) {
    return res.status(401).json({ error: 'User is inactive or not found' });
  }

  req.user = user;
  next();
};

/**
 * Middleware that enforces Role-Based Access Control (RBAC).
 * It checks if the authenticated user's role is included in the allowed roles array.
 * @param roles - An array of strings representing the roles allowed to access the route.
 * @returns An Express middleware function.
 */
export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient role' });
    }
    next();
  };
};
