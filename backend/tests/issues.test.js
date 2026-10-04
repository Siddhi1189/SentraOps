import { jest } from '@jest/globals';
import request from 'supertest';
import { computeFingerprint, extractInAppFrames } from '../src/utils/fingerprint.js';
import { signAccessToken } from '../src/utils/jwt.js';

const mockDb = {
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
    deleteMany: jest.fn(),
  },
  service: {
    findFirst: jest.fn(),
  },
  incident: {
    create: jest.fn(),
  },
  timelineEvent: {
    create: jest.fn(),
  },
  auditLog: {
    create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
  },
  project: {
    findFirst: jest.fn(),
  },
  $transaction: jest.fn((cb) => cb(mockDb)),
  $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
  $on: jest.fn(),
};

jest.unstable_mockModule('../src/config/db.js', () => ({
  default: mockDb,
}));

jest.unstable_mockModule('../src/config/queue.js', () => ({
  healthCheckQueue: { add: jest.fn() },
  notificationQueue: { add: jest.fn() },
  maintenanceQueue: { add: jest.fn() },
  ingestQueue: { add: jest.fn() },
  enqueueIngestEvent: jest.fn(),
  registerServiceJob: jest.fn(),
  removeServiceJob: jest.fn(),
  enqueueNotification: jest.fn(),
  enqueueMaintenanceCheck: jest.fn(),
  default: {},
}));

const { default: app } = await import('../src/app.js');
const { processIngestJob } = await import('../worker/processors/ingest.processor.js');

describe('Issue Grouping & Issue Management (Phase 2 Step 2.3)', () => {
  const orgId = '11111111-1111-4111-a111-111111111111';
  const otherOrgId = '22222222-2222-4222-a222-222222222222';
  const userId = '33333333-3333-4333-a333-333333333333';
  const projectId = '44444444-4444-4444-a444-444444444444';
  const issueId = '55555555-5555-4555-a555-555555555555';
  const serviceId = '66666666-6666-4666-a666-666666666666';

  const authHeader = `Bearer ${signAccessToken({
    userId,
    email: 'engineer@example.com',
    role: 'admin',
    organizationId: orgId,
  })}`;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Fingerprinting Algorithm', () => {
    it('produces the same fingerprint for identical error type and in-app frames', () => {
      const stack1 = `TypeError: Cannot read property of undefined
    at checkout (src/services/order.js:42:10)
    at processPayment (src/services/pay.js:15:3)
    at node_modules/express/router.js:10:5
    at handleRoute (src/routes/api.js:88:12)`;

      const stack2 = `TypeError: Cannot read property of undefined
    at checkout (src/services/order.js:99:10)
    at processPayment (src/services/pay.js:15:3)
    at handleRoute (src/routes/api.js:88:12)`;

      const fp1 = computeFingerprint('TypeError', stack1);
      const fp2 = computeFingerprint('TypeError', stack2);

      expect(fp1).toBe(fp2);
    });

    it('produces different fingerprints for different error types', () => {
      const stack = `Error: Something failed\n    at run (src/app.js:10:5)`;
      const fp1 = computeFingerprint('TypeError', stack);
      const fp2 = computeFingerprint('ReferenceError', stack);

      expect(fp1).not.toBe(fp2);
    });

    it('filters out node_modules and internal frames', () => {
      const stack = `Error: Fail
    at node_modules/express/lib/router.js:100:5
    at handle (src/controller.js:20:10)
    at internal/process/task_queues:95:5`;

      const frames = extractInAppFrames(stack);
      expect(frames).toHaveLength(1);
      expect(frames[0]).toBe('controller.js:handle');
    });
  });

  describe('Ingest Processor Grouping & Regression', () => {
    it('creates a new issue and publishes issue-created event when error is seen for the first time', async () => {
      const publishMock = jest.fn();
      mockDb.issue.findUnique.mockResolvedValueOnce(null);
      mockDb.issue.create.mockResolvedValueOnce({
        id: issueId,
        projectId,
        organizationId: orgId,
        title: 'TypeError: Order not found',
        environment: 'production',
      });
      mockDb.errorEvent.create.mockResolvedValueOnce({ id: 'evt-1' });

      const job = {
        data: {
          eventId: 'evt-1',
          projectId,
          organizationId: orgId,
          event: {
            type: 'TypeError',
            message: 'Order not found',
            stack: 'TypeError: Order not found\n    at checkout (src/order.js:10:5)',
            environment: 'production',
            level: 'error',
          },
        },
      };

      await processIngestJob(job, publishMock);

      expect(mockDb.issue.create).toHaveBeenCalled();
      expect(publishMock).toHaveBeenCalledWith(
        orgId,
        'issue-created',
        expect.objectContaining({
          issueId,
          projectId,
        })
      );
    });

    it('increments event count and does not publish if issue already exists and is unresolved', async () => {
      const publishMock = jest.fn();
      mockDb.issue.findUnique.mockResolvedValueOnce({
        id: issueId,
        status: 'unresolved',
        eventCount: 3,
      });
      mockDb.issue.update.mockResolvedValueOnce({
        id: issueId,
        status: 'unresolved',
        eventCount: 4,
      });
      mockDb.errorEvent.create.mockResolvedValueOnce({ id: 'evt-2' });

      const job = {
        data: {
          eventId: 'evt-2',
          projectId,
          organizationId: orgId,
          event: {
            type: 'TypeError',
            message: 'Order not found',
            stack: 'TypeError: Order not found\n    at checkout (src/order.js:10:5)',
          },
        },
      };

      await processIngestJob(job, publishMock);

      expect(mockDb.issue.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventCount: { increment: 1 },
          }),
        })
      );
      expect(publishMock).not.toHaveBeenCalled();
    });

    it('detects regression when a resolved issue receives an event', async () => {
      const publishMock = jest.fn();
      mockDb.issue.findUnique.mockResolvedValueOnce({
        id: issueId,
        status: 'resolved',
        eventCount: 5,
      });
      mockDb.issue.update.mockResolvedValueOnce({
        id: issueId,
        status: 'unresolved',
        isRegression: true,
        eventCount: 6,
        title: 'TypeError: Order not found',
        environment: 'production',
      });
      mockDb.errorEvent.create.mockResolvedValueOnce({ id: 'evt-3' });

      const job = {
        data: {
          eventId: 'evt-3',
          projectId,
          organizationId: orgId,
          event: {
            type: 'TypeError',
            message: 'Order not found',
            stack: 'TypeError: Order not found\n    at checkout (src/order.js:10:5)',
          },
        },
      };

      await processIngestJob(job, publishMock);

      expect(mockDb.issue.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'unresolved',
            isRegression: true,
            resolvedAt: null,
          }),
        })
      );
      expect(publishMock).toHaveBeenCalledWith(
        orgId,
        'issue-regression',
        expect.objectContaining({
          issueId,
          projectId,
        })
      );
    });

    it('does not publish any events if issue is marked ignored', async () => {
      const publishMock = jest.fn();
      mockDb.issue.findUnique.mockResolvedValueOnce({
        id: issueId,
        status: 'ignored',
        eventCount: 10,
      });
      mockDb.issue.update.mockResolvedValueOnce({
        id: issueId,
        status: 'ignored',
      });
      mockDb.errorEvent.create.mockResolvedValueOnce({ id: 'evt-4' });

      const job = {
        data: {
          eventId: 'evt-4',
          projectId,
          organizationId: orgId,
          event: {
            type: 'TypeError',
            message: 'Order not found',
            stack: 'TypeError: Order not found\n    at checkout (src/order.js:10:5)',
          },
        },
      };

      await processIngestJob(job, publishMock);

      expect(mockDb.errorEvent.create).toHaveBeenCalled();
      expect(publishMock).not.toHaveBeenCalled();
    });
  });

  describe('Issue Endpoints', () => {
    it('GET /api/issues lists issues for caller organization', async () => {
      mockDb.issue.findMany.mockResolvedValueOnce([
        { id: issueId, title: 'TypeError: Broken', status: 'unresolved', organizationId: orgId },
      ]);
      mockDb.issue.count.mockResolvedValueOnce(1);

      const res = await request(app)
        .get('/api/issues')
        .set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.issues).toHaveLength(1);
      expect(mockDb.issue.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ organizationId: orgId }),
        })
      );
    });

    it('GET /api/issues/:id returns single issue with latest error event', async () => {
      mockDb.issue.findFirst.mockResolvedValueOnce({
        id: issueId,
        title: 'TypeError: Broken',
        organizationId: orgId,
        errorEvents: [{ id: 'evt-1', message: 'Broken' }],
      });

      const res = await request(app)
        .get(`/api/issues/${issueId}`)
        .set('Authorization', authHeader);

      expect(res.status).toBe(200);
      expect(res.body.data.issue.id).toBe(issueId);
      expect(res.body.data.issue.errorEvents).toBeDefined();
    });

    it('PATCH /api/issues/:id updates status and checks optimistic concurrency', async () => {
      const updatedAt = new Date().toISOString();
      mockDb.issue.findFirst.mockResolvedValueOnce({
        id: issueId,
        organizationId: orgId,
        status: 'unresolved',
        updatedAt: new Date(updatedAt),
      });
      mockDb.issue.update.mockResolvedValueOnce({
        id: issueId,
        status: 'resolved',
        resolvedAt: new Date(),
      });

      const res = await request(app)
        .patch(`/api/issues/${issueId}`)
        .set('Authorization', authHeader)
        .send({
          status: 'resolved',
          currentUpdatedAt: updatedAt,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockDb.issue.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: issueId, organizationId: orgId },
          data: expect.objectContaining({ status: 'resolved' }),
        })
      );
    });

    it('PATCH /api/issues/:id returns 409 when currentUpdatedAt does not match', async () => {
      mockDb.issue.findFirst.mockResolvedValueOnce({
        id: issueId,
        organizationId: orgId,
        status: 'unresolved',
        updatedAt: new Date('2026-10-04T12:00:00Z'),
      });

      const res = await request(app)
        .patch(`/api/issues/${issueId}`)
        .set('Authorization', authHeader)
        .send({
          status: 'resolved',
          currentUpdatedAt: '2026-10-04T10:00:00Z', // Outdated
        });

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('CONCURRENCY_ERROR');
    });

    it('POST /api/issues/:id/incident creates an incident linked to the issue', async () => {
      mockDb.issue.findFirst.mockResolvedValueOnce({
        id: issueId,
        organizationId: orgId,
        title: 'Critical Database Crash',
      });
      mockDb.service.findFirst.mockResolvedValueOnce({
        id: serviceId,
        organizationId: orgId,
        name: 'Database API',
      });
      mockDb.incident.create.mockResolvedValueOnce({
        id: 'inc-999',
        title: 'Incident from Issue: Critical Database Crash',
        serviceId,
        status: 'open',
      });
      mockDb.timelineEvent.create.mockResolvedValueOnce({ id: 'tl-1' });
      mockDb.issue.update.mockResolvedValueOnce({
        id: issueId,
        linkedIncidentId: 'inc-999',
      });

      const res = await request(app)
        .post(`/api/issues/${issueId}/incident`)
        .set('Authorization', authHeader)
        .send({
          serviceId,
          severity: 'high',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.incident.id).toBe('inc-999');
      expect(mockDb.timelineEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            incidentId: 'inc-999',
          }),
        })
      );
      expect(mockDb.issue.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            linkedIncidentId: 'inc-999',
          }),
        })
      );
    });
  });
});
