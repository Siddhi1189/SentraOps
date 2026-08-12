/**
 * Incidents API Test Suite
 * Prisma is mocked — no real DB connection required.
 */

import { jest } from '@jest/globals';
import request from 'supertest';
import { signAccessToken } from '../src/utils/jwt.js';

jest.unstable_mockModule('../src/config/db.js', () => ({
  default: {
    incident: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      findFirst: jest.fn().mockResolvedValue(null),
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue(null),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    timelineEvent: {
      findMany: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockResolvedValue(null),
    },
    $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
    $on: jest.fn(),
  },
}));

const { default: app } = await import('../src/app.js');

describe('Incidents API Endpoints (/api/v1/incidents)', () => {
  const mockOrgId = '33333333-3333-4333-a333-333333333333';
  const mockUserId = '44444444-4444-4444-a444-444444444444';
  const validToken = signAccessToken({ userId: mockUserId, organizationId: mockOrgId, role: 'admin' });

  it('GET /api/v1/incidents with auth should return X-Request-ID header', async () => {
    const res = await request(app)
      .get('/api/v1/incidents')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.headers).toHaveProperty('x-request-id');
  });

  it('PATCH /api/v1/incidents/:id with invalid transition status should fail validation', async () => {
    const res = await request(app)
      .patch('/api/v1/incidents/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${validToken}`)
      .send({
        status: 'invalid_status_type',
      });

    expect(res.status).toBe(400);
  });
});
