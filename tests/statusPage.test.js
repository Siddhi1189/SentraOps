/**
 * Status Page Test Suite
 * Uses Jest module mocking so Prisma is never called (no real DB required).
 */

import { jest } from '@jest/globals';
import request from 'supertest';

// Mock the Prisma client BEFORE importing the app.
jest.unstable_mockModule('../src/config/db.js', () => ({
  default: {
    statusPageSettings: {
      findFirst: jest.fn().mockResolvedValue(null),
    },
    incident: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    service: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    maintenanceWindow: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
    $on: jest.fn(),
  },
}));

const { default: app } = await import('../src/app.js');

describe('Public Status Page API Endpoints (/status)', () => {
  it('GET /status/:slug for non-existent subdomain should return 404', async () => {
    const res = await request(app).get('/status/non-existent-subdomain-123456');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });

  it('GET /api/v1/status/:slug for non-existent subdomain should also return 404', async () => {
    const res = await request(app).get('/api/v1/status/non-existent-subdomain-123456');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
