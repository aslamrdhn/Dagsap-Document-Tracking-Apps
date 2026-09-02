import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { buildApp } from '../../server';
import type { Express } from 'express';
import { verifyToken } from '../../server/auth';
import { prisma } from '../../server/db';
import { redisClient } from '../../server/redis';

// Mock DB and Auth
vi.mock('../../server/db', () => ({
  prisma: {
    document: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    documentType: {
      findMany: vi.fn(),
    },
    documentEvent: {
      create: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    }
  }
}));

vi.mock('../../server/auth', () => ({
  verifyToken: vi.fn(),
  generateToken: vi.fn(),
  generateRefreshToken: vi.fn(),
}));

vi.mock('../../server/redis', () => ({
  redisClient: {
    status: 'ready',
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    connect: vi.fn(),
    on: vi.fn(),
  },
  connectRedis: vi.fn(),
}));

describe('Documents API', () => {
  let app: Express;

  beforeEach(async () => {
    vi.clearAllMocks();
    app = await buildApp();
    
    // Mock valid token & user by default for protected routes
    vi.mocked(verifyToken).mockReturnValue({ userId: '1' } as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: '1', role: 'ADMIN', active: true } as any);
  });

  describe('GET /api/documents', () => {
    it('returns empty array when no documents', async () => {
      vi.mocked(redisClient.get).mockResolvedValue(null);
      vi.mocked(prisma.document.findMany).mockResolvedValue([]);
      
      const response = await request(app)
        .get('/api/documents')
        .set('Authorization', 'Bearer fake-token');
        
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('returns cached documents if available', async () => {
      const cachedDocs = [{ id: '1', documentNumber: 'DAG-2026-000001' }];
      vi.mocked(redisClient.get).mockResolvedValue(JSON.stringify(cachedDocs));
      
      const response = await request(app)
        .get('/api/documents')
        .set('Authorization', 'Bearer fake-token');
        
      expect(response.status).toBe(200);
      expect(response.body).toEqual(cachedDocs);
      expect(prisma.document.findMany).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/documents', () => {
    it('creates a document successfully', async () => {
      const mockDoc = { id: 'doc-1', documentNumber: 'DAG-2026-000001' };
      vi.mocked(prisma.document.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.document.create).mockResolvedValue(mockDoc as any);
      vi.mocked(prisma.documentEvent.create).mockResolvedValue({} as any);

      const response = await request(app)
        .post('/api/documents')
        .set('Authorization', 'Bearer fake-token')
        .send({
          documentTypeId: 'type-1',
          originLocationId: 'loc-1',
          destinationLocationId: 'loc-2',
          description: 'Test document',
        });

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('doc-1');
      expect(prisma.document.create).toHaveBeenCalled();
    });
  });
});
