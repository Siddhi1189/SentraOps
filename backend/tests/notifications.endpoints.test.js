/**
 * Notifications Endpoints Test Suite
 * Tests tenant isolation, role checks, idempotent read, read-all, and unreadCount.
 */

import { jest } from '@jest/globals';
import request from 'supertest';
import { signAccessToken } from '../src/utils/jwt.js';

const mockDb = {
  notification: {
    findMany: jest.fn(),
    count: jest.fn(),
    findFirst: jest.fn(),
  },
  notificationRead: {
    upsert: jest.fn(),
    createMany: jest.fn(),
  },
  $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
  $on: jest.fn(),
};

jest.unstable_mockModule('../src/config/db.js', () => ({
  default: mockDb,
}));

const { default: app } = await import('../src/app.js');

describe('Notifications API Endpoints (/api/notifications)', () => {
  const orgA = '11111111-1111-4111-a111-111111111111';
  const orgB = '22222222-2222-4222-a222-222222222222';
  const user1 = '33333333-3333-4333-a333-333333333333';
  const viewerUser = '44444444-4444-4444-a444-444444444444';
  const notifId = '55555555-5555-4555-a555-555555555555';

  const user1Token = signAccessToken({ userId: user1, organizationId: orgA, role: 'admin' });
  const viewerToken = signAccessToken({ userId: viewerUser, organizationId: orgA, role: 'viewer' });
  const orgBToken = signAccessToken({ userId: user1, organizationId: orgB, role: 'admin' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/notifications', () => {
    it('requires authentication (returns 401 when no token)', async () => {
      const res = await request(app).get('/api/notifications');
      expect(res.status).toBe(401);
    });

    it('allows any role (including viewer) to fetch notifications', async () => {
      mockDb.notification.findMany.mockResolvedValueOnce([
        {
          id: notifId,
          channel: 'email',
          recipient: 'ops@acme.com',
          status: 'sent',
          sentAt: new Date(),
          createdAt: new Date(),
          incident: { id: 'inc-1', title: 'High CPU', severity: 'critical' },
          maintenance: null,
          notificationReads: [],
        },
      ]);
      mockDb.notification.count
        .mockResolvedValueOnce(1) // total
        .mockResolvedValueOnce(1); // unreadCount

      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.notifications).toHaveLength(1);
      expect(res.body.data.notifications[0].title).toBe('Incident: High CPU');
      expect(res.body.data.notifications[0].isRead).toBe(false);
      expect(res.body.data.unreadCount).toBe(1);
      expect(res.body.meta.total).toBe(1);
    });

    it('derives maintenance title and respects readAt for isRead', async () => {
      mockDb.notification.findMany.mockResolvedValueOnce([
        {
          id: notifId,
          channel: 'slack',
          recipient: 'https://hooks.slack.com/...',
          status: 'sent',
          sentAt: new Date(),
          createdAt: new Date(),
          incident: null,
          maintenance: { id: 'maint-1', title: 'DB Upgrade' },
          notificationReads: [{ id: 'read-1', readAt: new Date() }],
        },
      ]);
      mockDb.notification.count
        .mockResolvedValueOnce(1)
        .mockResolvedValueOnce(0); // 0 unread

      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.notifications[0].title).toBe('Maintenance: DB Upgrade');
      expect(res.body.data.notifications[0].isRead).toBe(true);
      expect(res.body.data.unreadCount).toBe(0);
    });
  });

  describe('PATCH /api/notifications/:id/read', () => {
    it('enforces tenant isolation (returns 404 if notification belongs to another org)', async () => {
      // Notification belongs to orgA, but request made with orgB token
      mockDb.notification.findFirst.mockResolvedValueOnce(null);

      const res = await request(app)
        .patch(`/api/notifications/${notifId}/read`)
        .set('Authorization', `Bearer ${orgBToken}`);

      expect(res.status).toBe(404);
      expect(mockDb.notificationRead.upsert).not.toHaveBeenCalled();
    });

    it('idempotently marks notification as read for current user', async () => {
      mockDb.notification.findFirst.mockResolvedValueOnce({
        id: notifId,
        organizationId: orgA,
      });
      mockDb.notificationRead.upsert.mockResolvedValueOnce({
        id: 'read-123',
        notificationId: notifId,
        userId: user1,
      });

      const res = await request(app)
        .patch(`/api/notifications/${notifId}/read`)
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockDb.notificationRead.upsert).toHaveBeenCalledWith({
        where: {
          notificationId_userId: { notificationId: notifId, userId: user1 },
        },
        update: {},
        create: { notificationId: notifId, userId: user1 },
      });
    });
  });

  describe('PATCH /api/notifications/read-all', () => {
    it('marks unread notifications as read only for the caller and their org', async () => {
      mockDb.notification.findMany.mockResolvedValueOnce([
        { id: 'notif-1' },
        { id: 'notif-2' },
      ]);
      mockDb.notificationRead.createMany.mockResolvedValueOnce({ count: 2 });

      const res = await request(app)
        .patch('/api/notifications/read-all')
        .set('Authorization', `Bearer ${user1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockDb.notification.findMany).toHaveBeenCalledWith({
        where: {
          organizationId: orgA,
          notificationReads: {
            none: { userId: user1 },
          },
        },
        select: { id: true },
      });
      expect(mockDb.notificationRead.createMany).toHaveBeenCalledWith({
        data: [
          { notificationId: 'notif-1', userId: user1 },
          { notificationId: 'notif-2', userId: user1 },
        ],
        skipDuplicates: true,
      });
    });
  });
});
