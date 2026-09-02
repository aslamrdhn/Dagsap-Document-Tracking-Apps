import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { buildApp } from '../../server';
import type { Express } from 'express';
import { verifyToken } from '../../server/auth';
import { prisma } from '../../server/db';

// Mock DB and Auth
vi.mock('../../server/db', () => ({
  prisma: {
    location: {
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    }
  }
}));

vi.mock('../../server/auth', () => ({
  verifyToken: vi.fn(),
}));

vi.mock('../../server/redis', () => ({
  redisClient: { status: 'ready', get: vi.fn(), set: vi.fn(), del: vi.fn(), connect: vi.fn(), on: vi.fn() },
  connectRedis: vi.fn(),
}));

describe('Locations API', () => {
  let app: Express;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = await buildApp();
  });

  const setupAuth = (role: string = 'SUPER_ADMIN') => {
    vi.mocked(verifyToken).mockReturnValue({ userId: '1' } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: '1', role, active: true } as any);
  };

  describe('GET /api/locations', () => {
    it('allows any authenticated user', async () => {
      setupAuth('USER');
      vi.mocked(prisma.location.findMany).mockResolvedValue([]);
      
      const response = await request(app)
        .get('/api/locations')
        .set('Authorization', 'Bearer token');
        
      expect(response.status).toBe(200);
      expect(prisma.location.findMany).toHaveBeenCalled();
    });
  });

  describe('POST /api/locations', () => {
    it('rejects non-superadmin users', async () => {
      setupAuth('ADMIN');
      const response = await request(app)
        .post('/api/locations')
        .set('Authorization', 'Bearer token')
        .send({ code: 'HO', name: 'Head Office', type: 'BRANCH' });
      expect(response.status).toBe(403);
    });

    it('allows superadmin to create location', async () => {
      setupAuth('SUPER_ADMIN');
      vi.mocked(prisma.location.create).mockResolvedValue({ id: 'loc-1' } as any);
      const response = await request(app)
        .post('/api/locations')
        .set('Authorization', 'Bearer token')
        .send({ code: 'HO', name: 'Head Office', type: 'BRANCH' });
      expect(response.status).toBe(200);
    });
  });

  describe('PUT /api/locations/:id', () => {
    it('allows superadmin to update', async () => {
      setupAuth('SUPER_ADMIN');
      vi.mocked(prisma.location.update).mockResolvedValue({ id: 'loc-1' } as any);
      const response = await request(app)
        .put('/api/locations/loc-1')
        .set('Authorization', 'Bearer token');
      expect(response.status).toBe(200);
    });
  });

  describe('DELETE /api/locations/:id', () => {
    it('allows superadmin to delete', async () => {
      setupAuth('SUPER_ADMIN');
      vi.mocked(prisma.location.delete).mockResolvedValue({} as any);
      const response = await request(app)
        .delete('/api/locations/loc-1')
        .set('Authorization', 'Bearer token');
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
