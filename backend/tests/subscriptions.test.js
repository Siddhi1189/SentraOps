import { jest } from '@jest/globals';
import request from 'supertest';
import crypto from 'crypto';

const mockOrgId = '22222222-2222-4222-a222-222222222222';
const mockOrgSlug = 'acme-corp';
const mockConfirmToken = 'aabbccdd'.repeat(8); // 64 hex chars
const mockUnsubToken = 'deadbeef'.repeat(8);

const mockOrg = {
  id: mockOrgId,
  slug: mockOrgSlug,
  name: 'Acme Corp',
};

let mockSubscriber = {
  id: 'sub-001',
  organizationId: mockOrgId,
  email: 'user@example.com',
  confirmToken: mockConfirmToken,
  unsubscribeToken: mockUnsubToken,
  confirmedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockEnqueueNotification = jest.fn().mockResolvedValue({ id: 'notif-job-1' });

const prismaMock = {
  organization: {
    findUnique: jest.fn().mockImplementation(({ where }) => {
      if (where.slug === mockOrgSlug || where.id === mockOrgId) {
        return Promise.resolve(mockOrg);
      }
      return Promise.resolve(null);
    }),
  },
  statusSubscriber: {
    findUnique: jest.fn().mockImplementation(({ where }) => {
      if (where.confirmToken === mockConfirmToken) {
        return Promise.resolve(mockSubscriber);
      }
      if (where.unsubscribeToken === mockUnsubToken) {
        return Promise.resolve(mockSubscriber);
      }
      if (
        where.organizationId_email &&
        where.organizationId_email.organizationId === mockOrgId &&
        where.organizationId_email.email === 'user@example.com'
      ) {
        return Promise.resolve(null); // fresh subscribe
      }
      return Promise.resolve(null);
    }),
    create: jest.fn().mockResolvedValue({
      ...mockSubscriber,
      confirmToken: mockConfirmToken,
      unsubscribeToken: mockUnsubToken,
    }),
    update: jest.fn().mockImplementation(({ data }) => {
      return Promise.resolve({ ...mockSubscriber, ...data });
    }),
    delete: jest.fn().mockResolvedValue(mockSubscriber),
    findMany: jest.fn().mockResolvedValue([]),
  },
};

jest.unstable_mockModule('../src/config/db.js', () => ({ default: prismaMock }));
jest.unstable_mockModule('../src/config/queue.js', () => ({
  enqueueNotification: mockEnqueueNotification,
  notificationQueue: { add: jest.fn() },
  healthCheckQueue: { add: jest.fn(), getRepeatableJobs: jest.fn().mockResolvedValue([]) },
  maintenanceQueue: { add: jest.fn() },
  ingestQueue: { add: jest.fn() },
  registerServiceJob: jest.fn(),
  removeServiceJob: jest.fn(),
  enqueueMaintenanceCheck: jest.fn(),
  enqueueIngestEvent: jest.fn(),
}));

jest.unstable_mockModule('../src/config/redis.js', () => {
  const mockRedis = { get: jest.fn().mockResolvedValue(null), set: jest.fn(), del: jest.fn(), subscribe: jest.fn(), on: jest.fn(), disconnect: jest.fn() };
  return {
    redis: mockRedis,
    Redis: jest.fn(() => mockRedis),
    redisConnectionOptions: { connection: { url: 'redis://localhost:6379', maxRetriesPerRequest: null } },
    default: { redis: mockRedis, Redis: jest.fn(() => mockRedis), redisConnectionOptions: {} },
  };
});


const { default: app } = await import('../src/app.js');

describe('Step 3.5 — Status Page Subscriptions (Double Opt-In)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset subscriber to unconfirmed
    mockSubscriber = { ...mockSubscriber, confirmedAt: null };
    prismaMock.statusSubscriber.findUnique.mockImplementation(({ where }) => {
      if (where.confirmToken === mockConfirmToken) return Promise.resolve({ ...mockSubscriber });
      if (where.unsubscribeToken === mockUnsubToken) return Promise.resolve({ ...mockSubscriber });
      if (where.organizationId_email) return Promise.resolve(null);
      return Promise.resolve(null);
    });
  });

  describe('POST /status/:orgSlug/subscribe', () => {
    it('returns 202 and queues confirmation email for valid email', async () => {
      const res = await request(app)
        .post(`/status/${mockOrgSlug}/subscribe`)
        .send({ email: 'user@example.com' })
        .expect(202);

      expect(res.body.message).toMatch(/confirmation email sent/i);
      expect(mockEnqueueNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: 'email',
          recipient: 'user@example.com',
        })
      );
    });

    it('returns 400 for invalid email', async () => {
      const res = await request(app)
        .post(`/status/${mockOrgSlug}/subscribe`)
        .send({ email: 'not-an-email' })
        .expect(400);

      expect(res.body.error || res.body.message).toBeTruthy();
    });

    it('returns 404 for unknown org slug', async () => {
      prismaMock.organization.findUnique.mockResolvedValueOnce(null);
      await request(app)
        .post('/status/unknown-org/subscribe')
        .send({ email: 'user@example.com' })
        .expect(404);
    });
  });

  describe('GET /status/confirm/:token', () => {
    it('confirms a pending subscriber', async () => {
      const res = await request(app)
        .get(`/status/confirm/${mockConfirmToken}`)
        .expect(200);

      expect(res.body.message).toMatch(/confirmed/i);
      expect(prismaMock.statusSubscriber.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ confirmedAt: expect.any(Date) }),
        })
      );
    });

    it('returns 400 for invalid confirmation token', async () => {
      prismaMock.statusSubscriber.findUnique.mockResolvedValueOnce(null);
      await request(app)
        .get('/status/confirm/invalid-token')
        .expect(400);
    });
  });

  describe('GET /status/unsubscribe/:token', () => {
    it('removes subscriber on valid unsubscribe token', async () => {
      const res = await request(app)
        .get(`/status/unsubscribe/${mockUnsubToken}`)
        .expect(200);

      expect(res.body.message).toMatch(/unsubscribed/i);
      expect(prismaMock.statusSubscriber.delete).toHaveBeenCalled();
    });

    it('returns 400 for invalid unsubscribe token', async () => {
      prismaMock.statusSubscriber.findUnique.mockResolvedValueOnce(null);
      await request(app)
        .get('/status/unsubscribe/invalid-token')
        .expect(400);
    });
  });
});
