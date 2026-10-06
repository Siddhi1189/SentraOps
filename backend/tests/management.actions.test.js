import { jest } from '@jest/globals';
import request from 'supertest';
import { generateAccessToken } from '../src/utils/jwt.js';

const mockUserId = '11111111-1111-4111-a111-111111111111';
const mockOrgId = '22222222-2222-4222-a222-222222222222';
const mockServiceId = '33333333-3333-4333-a333-333333333333';
const mockIncidentId = '44444444-4444-4444-a444-444444444444';

const initialUpdatedAt = new Date('2026-10-04T10:00:00.000Z');

let mockService = {
  id: mockServiceId,
  organizationId: mockOrgId,
  name: 'Payment Service',
  url: 'https://pay.sentraops.com',
  monitorType: 'http',
  isActive: true,
  checkIntervalSeconds: 60,
  groupId: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

let mockIncident = {
  id: mockIncidentId,
  organizationId: mockOrgId,
  serviceId: mockServiceId,
  title: 'Elevated Latency',
  status: 'open',
  severity: 'high',
  acknowledgedAt: null,
  acknowledgedByUserId: null,
  createdAt: initialUpdatedAt,
  updatedAt: initialUpdatedAt,
};

const mockRemoveServiceJob = jest.fn().mockResolvedValue(true);
const mockRegisterServiceJob = jest.fn().mockResolvedValue(true);
const mockHealthCheckQueueAdd = jest.fn().mockResolvedValue({ id: 'job-123' });

const prismaMock = {
  service: {
    findFirst: jest.fn().mockImplementation(({ where }) => {
      if (where.id === mockServiceId && (!where.organizationId || where.organizationId === mockOrgId)) {
        return Promise.resolve(mockService);
      }
      return Promise.resolve(null);
    }),
    findUnique: jest.fn().mockImplementation(({ where }) => {
      if (where.id === mockServiceId) {
        return Promise.resolve(mockService);
      }
      return Promise.resolve(null);
    }),
    findMany: jest.fn().mockImplementation(({ where }) => {
      if (where.id?.in) {
        return Promise.resolve(where.id.in.map((id) => ({ ...mockService, id })));
      }
      return Promise.resolve([mockService]);
    }),
    update: jest.fn().mockImplementation(({ where, data }) => {
      mockService = { ...mockService, ...data, updatedAt: new Date() };
      return Promise.resolve(mockService);
    }),
    updateMany: jest.fn().mockImplementation(({ where, data }) => {
      if (data) {
        mockService = { ...mockService, ...data, updatedAt: new Date() };
      }
      return Promise.resolve({ count: where.id?.in?.length || 1 });
    }),
    deleteMany: jest.fn().mockImplementation(({ where }) => {
      return Promise.resolve({ count: where.id?.in?.length || 1 });
    }),
  },
  incident: {
    findFirst: jest.fn().mockImplementation(({ where }) => {
      if (where.id === mockIncidentId && (!where.organizationId || where.organizationId === mockOrgId)) {
        return Promise.resolve(mockIncident);
      }
      return Promise.resolve(null);
    }),
    findUnique: jest.fn().mockImplementation(({ where }) => {
      if (where.id === mockIncidentId) {
        return Promise.resolve(mockIncident);
      }
      return Promise.resolve(null);
    }),
    update: jest.fn().mockImplementation(({ where, data }) => {
      mockIncident = { ...mockIncident, ...data, updatedAt: new Date() };
      return Promise.resolve(mockIncident);
    }),
    updateMany: jest.fn().mockImplementation(({ where, data }) => {
      if (data) {
        mockIncident = { ...mockIncident, ...data, updatedAt: new Date() };
      }
      return Promise.resolve({ count: 1 });
    }),
  },
  timelineEvent: {
    create: jest.fn().mockImplementation(({ data }) => {
      return Promise.resolve({ id: 'tl-1', ...data, createdAt: new Date() });
    }),
  },
  auditLog: {
    create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
  },
  tag: {
    findUnique: jest.fn().mockResolvedValue(null),
    create: jest.fn().mockResolvedValue({ id: 'tag-1' }),
  },
  serviceTag: {
    createMany: jest.fn().mockResolvedValue({ count: 0 }),
    deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
  },
  user: {
    findUnique: jest.fn().mockResolvedValue({
      id: mockUserId,
      email: 'admin@sentraops.com',
      name: 'Admin User',
      role: 'admin',
      organizationId: mockOrgId,
    }),
  },
  $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
  $on: jest.fn(),
};

prismaMock.$transaction = jest.fn().mockImplementation(async (cb) => {
  if (typeof cb === 'function') {
    return cb(prismaMock);
  }
  return Promise.all(cb);
});

jest.unstable_mockModule('../src/config/db.js', () => ({
  default: prismaMock,
}));

jest.unstable_mockModule('../src/config/queue.js', () => ({
  healthCheckQueue: {
    add: mockHealthCheckQueueAdd,
  },
  notificationQueue: {
    add: jest.fn().mockResolvedValue({ id: 'job-notif' }),
  },
  maintenanceQueue: {
    add: jest.fn().mockResolvedValue({ id: 'job-maint' }),
  },
  ingestQueue: {
    add: jest.fn().mockResolvedValue({ id: 'job-ingest' }),
  },
  registerServiceJob: mockRegisterServiceJob,
  removeServiceJob: mockRemoveServiceJob,
  enqueueNotification: jest.fn().mockResolvedValue(true),
  enqueueMaintenanceCheck: jest.fn().mockResolvedValue(true),
  enqueueIngestEvent: jest.fn().mockResolvedValue(true),
  default: {
    healthCheckQueue: { add: mockHealthCheckQueueAdd },
    registerServiceJob: mockRegisterServiceJob,
    removeServiceJob: mockRemoveServiceJob,
  },
}));

const { default: app } = await import('../src/app.js');

const authHeader = `Bearer ${generateAccessToken({
  id: mockUserId,
  organizationId: mockOrgId,
  role: 'admin',
})}`;

describe('Step 3.2: Management Actions & Bulk Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockService = {
      id: mockServiceId,
      organizationId: mockOrgId,
      name: 'Payment Service',
      url: 'https://pay.sentraops.com',
      monitorType: 'http',
      isActive: true,
      checkIntervalSeconds: 60,
      groupId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockIncident = {
      id: mockIncidentId,
      organizationId: mockOrgId,
      serviceId: mockServiceId,
      title: 'Elevated Latency',
      status: 'open',
      severity: 'high',
      acknowledgedAt: null,
      acknowledgedByUserId: null,
      createdAt: initialUpdatedAt,
      updatedAt: initialUpdatedAt,
    };
  });

  describe('Service Pause and Resume', () => {
    it('pauses an active service, sets isActive=false and removes repeatable job', async () => {
      const res = await request(app)
        .post(`/api/services/${mockServiceId}/pause`)
        .set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.service.isActive).toBe(false);
      expect(mockRemoveServiceJob).toHaveBeenCalledWith(mockServiceId);
    });

    it('resumes a paused service, sets isActive=true and registers repeatable job', async () => {
      mockService.isActive = false;

      const res = await request(app)
        .post(`/api/services/${mockServiceId}/resume`)
        .set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.service.isActive).toBe(true);
      expect(mockRegisterServiceJob).toHaveBeenCalledWith(expect.objectContaining({ id: mockServiceId }));
    });
  });

  describe('Service Check-Now', () => {
    it('enqueues a one-off health check without executing monitoring directly in API', async () => {
      const res = await request(app)
        .post(`/api/services/${mockServiceId}/check-now`)
        .set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.enqueued).toBe(true);
      expect(mockHealthCheckQueueAdd).toHaveBeenCalledWith(
        'check',
        expect.objectContaining({ serviceId: mockServiceId }),
        expect.any(Object)
      );
    });
  });

  describe('Bulk Service Actions', () => {
    it('POST /api/services/bulk/pause pauses multiple services', async () => {
      const res = await request(app)
        .post('/api/services/bulk/pause')
        .set('Authorization', authHeader)
        .send({ serviceIds: [mockServiceId, '55555555-5555-5555-a555-555555555555'] });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.count).toBe(2);
      expect(mockRemoveServiceJob).toHaveBeenCalled();
    });

    it('POST /api/services/bulk/resume resumes multiple services', async () => {
      const res = await request(app)
        .post('/api/services/bulk/resume')
        .set('Authorization', authHeader)
        .send({ serviceIds: [mockServiceId] });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.count).toBe(1);
      expect(mockRegisterServiceJob).toHaveBeenCalled();
    });

    it('POST /api/services/bulk/interval enforces minimum interval of 30 seconds', async () => {
      const failRes = await request(app)
        .post('/api/services/bulk/interval')
        .set('Authorization', authHeader)
        .send({ serviceIds: [mockServiceId], checkIntervalSeconds: 10 });

      expect(failRes.status).toBe(400);

      const passRes = await request(app)
        .post('/api/services/bulk/interval')
        .set('Authorization', authHeader)
        .send({ serviceIds: [mockServiceId], checkIntervalSeconds: 45 });

      expect(passRes.status).toBe(200);
      expect(passRes.body.success).toBe(true);
      expect(passRes.body.data.count).toBe(1);
    });

    it('POST /api/services/bulk/group updates group assignment', async () => {
      const res = await request(app)
        .post('/api/services/bulk/group')
        .set('Authorization', authHeader)
        .send({ serviceIds: [mockServiceId], groupId: null });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.count).toBe(1);
    });

    it('DELETE /api/services/bulk deletes multiple services and removes their jobs', async () => {
      const res = await request(app)
        .delete('/api/services/bulk')
        .set('Authorization', authHeader)
        .send({ serviceIds: [mockServiceId] });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.count).toBe(1);
      expect(mockRemoveServiceJob).toHaveBeenCalledWith(mockServiceId);
    });
  });

  describe('Incident Acknowledge and Comments', () => {
    it('POST /api/incidents/:id/acknowledge marks incident acknowledged and appends timeline event', async () => {
      const res = await request(app)
        .post(`/api/incidents/${mockIncidentId}/acknowledge`)
        .set('Authorization', authHeader)
        .send({ updatedAt: initialUpdatedAt.toISOString() });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.incident.acknowledgedAt).toBeDefined();
      expect(res.body.data.incident.acknowledgedByUserId).toBe(mockUserId);
    });

    it('POST /api/incidents/:id/acknowledge rejects with 409 CONCURRENCY_ERROR on stale updatedAt', async () => {
      const staleTimestamp = new Date('2026-10-04T09:00:00.000Z').toISOString();

      const res = await request(app)
        .post(`/api/incidents/${mockIncidentId}/acknowledge`)
        .set('Authorization', authHeader)
        .send({ updatedAt: staleTimestamp });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONCURRENCY_ERROR');
    });

    it('POST /api/incidents/:id/comments appends note to incident timeline', async () => {
      const res = await request(app)
        .post(`/api/incidents/${mockIncidentId}/comments`)
        .set('Authorization', authHeader)
        .send({ comment: 'Investigating database pool exhaustion, restart queued.' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.event.description).toContain('Investigating database pool exhaustion');
    });
  });
});
