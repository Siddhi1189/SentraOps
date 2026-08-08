/**
 * Services API Test Suite
 * Prisma is mocked — no real DB connection required.
 */

import { jest } from '@jest/globals';
import request from 'supertest';
import { generateAccessToken } from '../src/utils/jwt.js';

jest.unstable_mockModule('../src/config/db.js', () => ({
  default: {
    service: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue(null),
      delete: jest.fn().mockResolvedValue(null),
    },
    escalationPolicy: {
      findFirst: jest.fn().mockResolvedValue(null),
    },
    $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
    $on: jest.fn(),
  },
}));

const { default: app } = await import('../src/app.js');

describe('Service & Multi-tenancy API Endpoints (/api/v1/services)', () => {
  const mockOrgId1 = '11111111-1111-4111-a111-111111111111';
  const mockUserId1 = '22222222-2222-4222-a222-222222222222';
  const validToken = generateAccessToken({ id: mockUserId1, organizationId: mockOrgId1, role: 'admin' });

  it('GET /api/v1/services with valid token should return X-Request-ID header', async () => {
    const res = await request(app)
      .get('/api/v1/services')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.headers).toHaveProperty('x-request-id');
  });

  it('POST /api/v1/services should validate payload schema via Zod', async () => {
    const res = await request(app)
      .post('/api/v1/services')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        name: 'A', // invalid: too short (< 2 chars)
        url: 'invalid-url',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
