/**
 * Auth & General Middleware Test Suite
 *
 * Tests unauthenticated and validation-layer behavior without hitting the DB.
 * Prisma is mocked to avoid requiring a real Postgres connection.
 */

import { jest } from '@jest/globals';
import request from 'supertest';

// Mock Prisma BEFORE importing the app
jest.unstable_mockModule('../src/config/db.js', () => ({
  default: {
    user: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(null),
    },
    organization: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(null),
    },
    refreshToken: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(null),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
    $on: jest.fn(),
  },
}));

const { default: app } = await import('../src/app.js');

describe('Auth API Endpoints (/api/v1/auth)', () => {
  it('GET /health should return 200 and healthy status structure', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('version');
    expect(res.body).toHaveProperty('checks');
    expect(res.body.checks).toHaveProperty('api', 'healthy');
  });

  it('POST /api/v1/auth/register should fail on invalid email schema', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        organizationName: 'Test Org',
        organizationSlug: 'test-org',
        userName: 'Admin User',
        email: 'invalid-email-format',
        password: 'password123',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/auth/login should fail on missing credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'nonexistent@test.com',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/v1/services without Bearer token should return 401 UNAUTHORIZED', async () => {
    const res = await request(app).get('/api/v1/services');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});
