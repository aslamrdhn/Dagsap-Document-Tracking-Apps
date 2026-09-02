import { Response, NextFunction } from 'express';
import { prisma } from '../db';
import { AuthRequest } from './authMiddleware';

export const auditLogger = (entityType: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    res.on('finish', () => {
      // We only log successful mutations (status 200 or 201)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        let action = '';
        if (req.method === 'POST') action = 'CREATE';
        else if (req.method === 'PUT') action = 'UPDATE';
        else if (req.method === 'DELETE') action = 'DELETE';

        if (action && req.user) {
          // Fire and forget, don't wait for Audit log to be saved
          prisma.auditLog.create({
            data: {
              userId: req.user.id,
              action,
              entity: entityType,
              entityId: req.params.id || 'Unknown', // Can't easily get body.id from finish event, so we use params or 'Unknown'
              metadata: JSON.stringify(req.body)
            }
          }).catch(err => {
            console.error('Failed to save audit log:', err);
          });
        }
      }
    });

    next();
  };
};
