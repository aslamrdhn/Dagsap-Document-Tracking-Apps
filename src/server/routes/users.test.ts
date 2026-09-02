import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { buildApp } from '../../server';
import type { Express } from 'express';
import { verifyToken } from '../../server/auth';
import { prisma } from '../../server/db';
import bcrypt from 'bcryptjs';

// Mock DB, Auth, and bcrypt
vi.mock('../../server/db', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
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

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_password'),
  }
}));

describe('Users API', () => {
  let app: Express;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = await buildApp();
  });

  const setupAuth = (role: string = 'SUPER_ADMIN') => {
    vi.mocked(verifyToken).mockReturnValue({ userId: '1' } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: '1', role, active: true } as any);
  };

  describe('GET /api/users', () => {
    it('allows ADMIN to fetch users', async () => {
      setupAuth('ADMIN');
      vi.mocked(prisma.user.findMany).mockResolvedValue([{ id: '2', name: 'Test' }] as any);
      
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', 'Bearer token');
        
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(1);
    });

    it('rejects USER role', async () => {
      setupAuth('USER');
      const response = await request(app).get('/api/users').set('Authorization', 'Bearer token');
      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/users', () => {
    it('allows SUPER_ADMIN to create user and hashes password', async () => {
      setupAuth('SUPER_ADMIN');
      vi.mocked(prisma.user.create).mockResolvedValue({ id: '2', password: 'hashed_password' } as any);
      
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', 'Bearer token')
        .send({ password: 'secretpassword', role: 'ADMIN' });
        
      expect(response.status).toBe(200);
      expect(bcrypt.hash).toHaveBeenCalledWith('secretpassword', 10);
      // Ensure password is not returned in response
      expect(response.body.password).toBeUndefined();
    });
  });
});
