import { jest } from '@jest/globals';
import request from 'supertest';
import crypto from 'crypto';
import { signAccessToken } from '../src/utils/jwt.js';

const mockDb = {
  project: {
    create: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  apiKey: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  issue: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  errorEvent: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  auditLog: {
    create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
  },
  organization: {
    findUnique: jest.fn(),
  },
  $transaction: jest.fn((cb) => cb(mockDb)),
  $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
  $on: jest.fn(),
};

const mockEnqueueIngestEvent = jest.fn().mockResolvedValue({ id: 'job-1' });

jest.unstable_mockModule('../src/config/db.js', () => ({
  default: mockDb,
}));

jest.unstable_mockModule('../src/config/queue.js', () => ({
  healthCheckQueue: { add: jest.fn() },
  notificationQueue: { add: jest.fn() },
  maintenanceQueue: { add: jest.fn() },
  ingestQueue: { add: jest.fn() },
  enqueueIngestEvent: mockEnqueueIngestEvent,
  registerServiceJob: jest.fn(),
  removeServiceJob: jest.fn(),
  enqueueNotification: jest.fn(),
  enqueueMaintenanceCheck: jest.fn(),
  default: {
    enqueueIngestEvent: mockEnqueueIngestEvent,
  },
}));

const { default: app } = await import('../src/app.js');

describe('Projects and Ingest API Endpoints (Phase 2 Step 2.1)', () => {
  const orgId = '11111111-1111-4111-a111-111111111111';
  const ownerUserId = '22222222-2222-4222-a222-222222222222';
  const viewerUserId = '33333333-3333-4333-a333-333333333333';
  const projectId = '44444444-4444-4444-a444-444444444444';

  const ownerToken = signAccessToken({ userId: ownerUserId, organizationId: orgId, role: 'owner' });
  const viewerToken = signAccessToken({ userId: viewerUserId, organizationId: orgId, role: 'viewer' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/projects', () => {
    it('creates a project successfully for owner', async () => {
      mockDb.project.count.mockResolvedValueOnce(2);
      mockDb.project.create.mockResolvedValueOnce({
        id: projectId,
        organizationId: orgId,
        name: 'web-store',
        platform: 'node',
        environmentDefault: 'production',
        createdAt: new Date().toISOString(),
      });

      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'web-store', platform: 'node' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.project.name).toBe('web-store');
      expect(mockDb.project.create).toHaveBeenCalled();
    });

    it('rejects project creation when quota of 5 projects is reached', async () => {
      mockDb.project.count.mockResolvedValueOnce(5);

      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'sixth-project', platform: 'node' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('PROJECT_QUOTA_EXCEEDED');
      expect(mockDb.project.create).not.toHaveBeenCalled();
    });

    it('rejects viewer role from creating projects with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ name: 'unauthorized-project' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(mockDb.project.create).not.toHaveBeenCalled();
    });
  });

  describe('GET /api/projects', () => {
    it('lists projects for caller organization with tenant isolation', async () => {
      mockDb.project.findMany.mockResolvedValueOnce([
        { id: projectId, organizationId: orgId, name: 'web-store', platform: 'node' },
      ]);

      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.projects).toHaveLength(1);
      expect(mockDb.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: orgId },
        })
      );
    });
  });

  describe('API Key Management (POST /api/projects/:id/keys & GET)', () => {
    it('generates API key and reveals plaintext key ONCE', async () => {
      mockDb.project.findByIdAndOrg = jest.fn().mockResolvedValueOnce({ id: projectId, organizationId: orgId });
      mockDb.project.findFirst.mockResolvedValueOnce({ id: projectId, organizationId: orgId });
      mockDb.apiKey.create.mockImplementationOnce(({ data }) => Promise.resolve({
        id: 'key-1',
        projectId,
        name: data.name,
        keyPrefix: data.keyPrefix,
        createdAt: new Date().toISOString(),
      }));

      const res = await request(app)
        .post(`/api/projects/${projectId}/keys`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'Test Key' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.apiKey.key).toMatch(/^sops_[A-Za-z0-9_-]{32}$/);
      expect(res.body.data.apiKey.keyPrefix).toBe(res.body.data.apiKey.key.substring(0, 8));
      expect(mockDb.apiKey.create).toHaveBeenCalled();
    });

    it('lists API keys showing keyPrefix and never plaintext key or hash', async () => {
      mockDb.project.findFirst.mockResolvedValueOnce({ id: projectId, organizationId: orgId });
      mockDb.apiKey.findMany.mockResolvedValueOnce([
        {
          id: 'key-1',
          projectId,
          name: 'Production Key',
          keyPrefix: 'sops_abc',
          lastUsedAt: null,
          revokedAt: null,
          createdAt: new Date().toISOString(),
        },
      ]);

      const res = await request(app)
        .get(`/api/projects/${projectId}/keys`)
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.apiKeys).toHaveLength(1);
      expect(res.body.data.apiKeys[0].keyPrefix).toBe('sops_abc');
      expect(res.body.data.apiKeys[0].key).toBeUndefined();
      expect(res.body.data.apiKeys[0].keyHash).toBeUndefined();
    });
  });

  describe('POST /api/ingest/events (Ingest API)', () => {
    const rawApiKey = 'sops_12345678901234567890123456789012';
    const keyHash = crypto.createHash('sha256').update(rawApiKey).digest('hex');

    it('rejects request without x-sentraops-key header with 401', async () => {
      const res = await request(app)
        .post('/api/ingest/events')
        .send({ type: 'TypeError', message: 'Cannot read properties of undefined' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('MISSING_API_KEY');
    });

    it('rejects revoked or unknown API key with 401', async () => {
      mockDb.apiKey.findUnique.mockResolvedValueOnce({
        id: 'key-revoked',
        keyHash,
        revokedAt: new Date().toISOString(),
        project: { id: projectId, organizationId: orgId },
      });

      const res = await request(app)
        .post('/api/ingest/events')
        .set('x-sentraops-key', rawApiKey)
        .send({ type: 'TypeError', message: 'Cannot read properties of undefined' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('INVALID_API_KEY');
    });

    it('rejects invalid payload (missing type/message) with 400 validation error', async () => {
      mockDb.apiKey.findUnique.mockResolvedValueOnce({
        id: 'key-active',
        keyHash,
        revokedAt: null,
        project: { id: projectId, organizationId: orgId },
      });

      const res = await request(app)
        .post('/api/ingest/events')
        .set('x-sentraops-key', rawApiKey)
        .send({ environment: 'production' }); // Missing type and message

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects stack trace exceeding 20,000 characters with 400', async () => {
      mockDb.apiKey.findUnique.mockResolvedValueOnce({
        id: 'key-active',
        keyHash,
        revokedAt: null,
        project: { id: projectId, organizationId: orgId },
      });

      const oversizedStack = 'a'.repeat(20001);
      const res = await request(app)
        .post('/api/ingest/events')
        .set('x-sentraops-key', rawApiKey)
        .send({ type: 'Error', message: 'Fail', stack: oversizedStack });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('accepts valid error event with 202 and enqueues job to BullMQ queue', async () => {
      mockDb.apiKey.findUnique.mockResolvedValueOnce({
        id: 'key-active',
        projectId,
        keyHash,
        revokedAt: null,
        project: { id: projectId, organizationId: orgId },
      });
      mockDb.apiKey.update.mockResolvedValueOnce({});

      const res = await request(app)
        .post('/api/ingest/events')
        .set('x-sentraops-key', rawApiKey)
        .send({
          type: 'ReferenceError',
          message: 'user is not defined',
          stack: 'ReferenceError: user is not defined\n    at checkout (server.js:42:10)\n    at node_modules/express/lib/router.js:10:5',
          environment: 'production',
          level: 'error',
          user: { id: 'usr-1', email: 'test@example.com' },
        });

      expect(res.status).toBe(202);
      expect(res.body.success).toBe(true);
      expect(res.body.data.eventId).toBeDefined();
      expect(res.body.data.status).toBe('queued');
      expect(mockEnqueueIngestEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId,
          organizationId: orgId,
          event: expect.objectContaining({
            type: 'ReferenceError',
            message: 'user is not defined',
          }),
        })
      );
    });
  });
});
