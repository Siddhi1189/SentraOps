import { jest } from '@jest/globals';
import request from 'supertest';
import { generateAccessToken } from '../src/utils/jwt.js';

const mockUserId = '11111111-1111-4111-a111-111111111111';
const mockOrgId = '22222222-2222-4222-a222-222222222222';
const mockServiceId = '33333333-3333-4333-a333-333333333333';
const mockOrgSlug = 'acme-perf';

const mockService = {
  id: mockServiceId,
  organizationId: mockOrgId,
  name: 'Telemetry Service',
  url: 'https://telemetry.sentraops.com',
  monitorType: 'http',
  currentStatus: 'up',
  isActive: true,
  checkIntervalSeconds: 60,
  groupId: null,
};

const mockStatusSettings = {
  id: '55555555-5555-5555-5555-555555555555',
  organizationId: mockOrgId,
  subdomain: mockOrgSlug,
  companyName: 'Acme Performance Corp',
  logoUrl: null,
  theme: 'light',
  organization: {
    id: mockOrgId,
    name: 'Acme Performance Corp',
    slug: mockOrgSlug,
  },
};

const prismaMock = {
  service: {
    findFirst: jest.fn().mockImplementation(({ where }) => {
      if (where.id === mockServiceId && (!where.organizationId || where.organizationId === mockOrgId)) {
        return Promise.resolve(mockService);
      }
      return Promise.resolve(null);
    }),
    findMany: jest.fn().mockResolvedValue([mockService]),
    count: jest.fn().mockResolvedValue(1),
  },
  statusPageSettings: {
    findUnique: jest.fn().mockImplementation(({ where }) => {
      if (where.subdomain === mockOrgSlug || where.organizationId === mockOrgId) {
        return Promise.resolve(mockStatusSettings);
      }
      return Promise.resolve(null);
    }),
    findFirst: jest.fn().mockImplementation(({ where }) => {
      if (where.subdomain === mockOrgSlug) {
        return Promise.resolve(mockStatusSettings);
      }
      return Promise.resolve(null);
    }),
  },
  healthCheck: {
    findMany: jest.fn().mockResolvedValue([
      {
        id: 'hc-1',
        serviceId: mockServiceId,
        status: 'up',
        responseTimeMs: 45,
        sslDaysRemaining: 75,
        checkedAt: new Date(),
      },
      {
        id: 'hc-2',
        serviceId: mockServiceId,
        status: 'up',
        responseTimeMs: 62,
        sslDaysRemaining: 75,
        checkedAt: new Date(Date.now() - 60000),
      },
    ]),
    findFirst: jest.fn().mockResolvedValue({
      id: 'hc-1',
      sslDaysRemaining: 75,
      checkedAt: new Date(),
    }),
  },
  $queryRaw: jest.fn().mockResolvedValue([
    {
      totalChecks: 120,
      upChecks: 119,
      uptimePercentage: 99.17,
      p50: 42,
      p95: 110,
      p99: 235,
    },
  ]),
  $queryRawUnsafe: jest.fn().mockImplementation((query) => {
    if (query.includes('percentile_cont')) {
      return Promise.resolve([
        {
          totalChecks: 120,
          upChecks: 119,
          uptimePercentage: 99.17,
          p50: 42,
          p95: 110,
          p99: 235,
        },
      ]);
    }
    if (query.includes('DATE_TRUNC')) {
      return Promise.resolve([
        {
          serviceId: mockServiceId,
          day: new Date(),
          totalChecks: 1440,
          upChecks: 1438,
          uptimePercentage: 99.86,
        },
      ]);
    }
    return Promise.resolve([]);
  }),
};

jest.unstable_mockModule('../src/config/db.js', () => ({
  default: prismaMock,
  prisma: prismaMock,
}));

jest.unstable_mockModule('../src/config/redis.js', () => ({
  redis: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
  },
  default: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue('OK'),
    del: jest.fn().mockResolvedValue(1),
  },
}));

const { default: app } = await import('../src/app.js');

describe('Step 3.3 — Performance Analytics, Percentiles & 90-Day Uptime API', () => {
  const token = generateAccessToken({
    id: mockUserId,
    organizationId: mockOrgId,
    role: 'admin',
    email: 'admin@acme.com',
  });

  const otherOrgToken = generateAccessToken({
    id: '99999999-9999-9999-9999-999999999999',
    organizationId: '88888888-8888-8888-8888-888888888888',
    role: 'admin',
    email: 'other@org.com',
  });

  it('GET /api/v1/analytics/services/:id/performance returns 24h/7d/30d percentiles, time series, sparkline and SSL', async () => {
    const res = await request(app)
      .get(`/api/v1/analytics/services/${mockServiceId}/performance`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const data = res.body.data;
    expect(data.serviceId).toBe(mockServiceId);
    expect(data.windows).toBeDefined();
    expect(data.windows['24h']).toBeDefined();
    expect(data.windows['7d']).toBeDefined();
    expect(data.windows['30d']).toBeDefined();

    expect(data.windows['24h'].p50).toBe(42);
    expect(data.windows['24h'].p95).toBe(110);
    expect(data.windows['24h'].p99).toBe(235);
    expect(data.windows['24h'].uptimePercentage).toBe(99.17);

    expect(Array.isArray(data.timeSeries)).toBe(true);
    expect(Array.isArray(data.sparkline)).toBe(true);
    expect(data.ssl).toEqual({
      daysRemaining: 75,
      checkedAt: expect.any(String),
    });
  });

  it('GET /api/v1/analytics/services/:id/performance blocks unauthorized org access', async () => {
    const res = await request(app)
      .get(`/api/v1/analytics/services/${mockServiceId}/performance`)
      .set('Authorization', `Bearer ${otherOrgToken}`);

    expect(res.status).toBe(404);
  });

  it('GET /status/:orgSlug/uptime returns public unauthenticated 90-day daily uptime history per service', async () => {
    const res = await request(app).get(`/status/${mockOrgSlug}/uptime`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.services)).toBe(true);
    expect(res.body.data.services.length).toBeGreaterThan(0);

    const svc = res.body.data.services[0];
    expect(svc.id).toBe(mockServiceId);
    expect(svc.overallUptime).toBeDefined();
    expect(Array.isArray(svc.history)).toBe(true);
    expect(svc.history.length).toBe(90);
    expect(svc.history[svc.history.length - 1].uptimePercentage).toBeDefined();
  });

  it('GET /status/:orgSlug/uptime returns 404 for invalid organization slug', async () => {
    const res = await request(app).get('/status/non-existent-slug/uptime');
    expect(res.status).toBe(404);
  });
});
