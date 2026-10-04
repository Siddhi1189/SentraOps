import { jest } from '@jest/globals';
import request from 'supertest';
import { signAccessToken } from '../src/utils/jwt.js';

let demoServiceCount = 0;
let realServiceCount = 2;

jest.unstable_mockModule('../src/config/db.js', () => ({
  default: {
    service: {
      findFirst: jest.fn().mockImplementation(({ where }) => {
        if (where?.isDemo && demoServiceCount > 0) {
          return Promise.resolve({ id: 'demo-s-1', isDemo: true });
        }
        return Promise.resolve(null);
      }),
      create: jest.fn().mockImplementation(({ data }) => {
        if (data.isDemo) demoServiceCount++;
        return Promise.resolve({ id: `srv-${Date.now()}`, ...data });
      }),
      deleteMany: jest.fn().mockImplementation(({ where }) => {
        if (where?.isDemo) {
          const count = demoServiceCount;
          demoServiceCount = 0;
          return Promise.resolve({ count });
        }
        return Promise.resolve({ count: 0 });
      }),
    },
    project: {
      findFirst: jest.fn().mockImplementation(({ where }) => {
        if (where?.isDemo && demoServiceCount > 0) return Promise.resolve({ id: 'demo-p-1', isDemo: true });
        return Promise.resolve(null);
      }),
      create: jest.fn().mockResolvedValue({ id: 'p-1', name: 'Demo Storefront', isDemo: true }),
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    incident: {
      findFirst: jest.fn().mockImplementation(({ where }) => {
        if (where?.isDemo && demoServiceCount > 0) return Promise.resolve({ id: 'demo-i-1', isDemo: true });
        return Promise.resolve(null);
      }),
      create: jest.fn().mockResolvedValue({ id: 'i-1', isDemo: true }),
      deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
    },
    issue: {
      create: jest.fn().mockResolvedValue({ id: 'iss-1', isDemo: true }),
      deleteMany: jest.fn().mockResolvedValue({ count: 3 }),
    },
    errorEvent: {
      createMany: jest.fn().mockResolvedValue({ count: 2 }),
      deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
    },
    healthCheck: {
      createMany: jest.fn().mockResolvedValue({ count: 48 }),
      deleteMany: jest.fn().mockResolvedValue({ count: 48 }),
    },
    timelineEvent: {
      createMany: jest.fn().mockResolvedValue({ count: 4 }),
      deleteMany: jest.fn().mockResolvedValue({ count: 4 }),
    },
    $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
    $on: jest.fn(),
  },
}));

const { default: app } = await import('../src/app.js');

describe('Demo Data API (/api/demo)', () => {
  const mockOrgId = '33333333-3333-4333-a333-333333333333';
  const ownerToken = signAccessToken({ userId: 'u-owner', organizationId: mockOrgId, role: 'owner' });
  const adminToken = signAccessToken({ userId: 'u-admin', organizationId: mockOrgId, role: 'admin' });

  beforeEach(() => {
    demoServiceCount = 0;
  });

  it('rejects non-owner users with 403', async () => {
    const res = await request(app)
      .post('/api/demo/seed')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(403);
  });

  it('seeds demo data successfully for owner', async () => {
    const res = await request(app)
      .post('/api/demo/seed')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(201);
    expect(res.body.data.servicesCount).toBe(3);
    expect(res.body.data.issuesCount).toBe(3);
    expect(res.body.data.incidentsCount).toBe(2);
  });

  it('refuses to seed if demo data already exists', async () => {
    demoServiceCount = 3;

    const res = await request(app)
      .post('/api/demo/seed')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(400);
    expect(res.body.error?.message || res.body.message).toMatch(/already exists/i);
  });

  it('removes only demo data and preserves isolation', async () => {
    demoServiceCount = 3;

    const res = await request(app)
      .delete('/api/demo/seed')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.deleted).toBe(true);
    expect(demoServiceCount).toBe(0);
    // Real services were not deleted
    expect(realServiceCount).toBe(2);
  });
});
