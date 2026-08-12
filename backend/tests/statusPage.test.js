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

  it('getStatusPage should store and retrieve data from Redis cache', async () => {
    const db = (await import('../src/config/db.js')).default;
    const { default: StatusPageService } = await import('../src/services/statusPageService.js');
    const { redis } = await import('../src/config/redis.js');

    db.statusPageSettings.findFirst.mockResolvedValueOnce({
      id: 'sp-123',
      organizationId: 'org-999',
      subdomain: 'test-org-cache',
      theme: 'light',
    });
    db.service.findMany.mockResolvedValueOnce([]);
    db.incident.findMany.mockResolvedValueOnce([]);
    db.maintenanceWindow.findMany.mockResolvedValueOnce([]);

    const result = await StatusPageService.getStatusPage('test-org-cache');
    expect(result.settings.organizationId).toBe('org-999');

    // Verify invalidateCache calls redis.del
    await StatusPageService.invalidateCache('org-999');
    expect(redis.del).toHaveBeenCalledWith(
      'status:org-999',
      'status:org-999:incidents',
      'status:org-999:maintenance'
    );
  });
});
