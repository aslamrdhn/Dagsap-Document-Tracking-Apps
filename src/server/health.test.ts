import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { buildApp } from '../server';
import type { Express } from 'express';

describe('Backend API', () => {
  let app: Express;

  beforeAll(async () => {
    // buildApp sets up Express without calling listen()
    app = await buildApp();
  });

  describe('GET /api/health', () => {
    it('should return status ok', async () => {
      const response = await request(app).get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok' });
    });
  });
});
