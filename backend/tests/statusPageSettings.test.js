/**
 * Status Page Settings Endpoints Test Suite
 * Tests role authorization, default fallback, upsert behavior, audit logging,
 * and confirms public status page endpoints behave unchanged.
 */

import { jest } from '@jest/globals';
import request from 'supertest';
import { signAccessToken } from '../src/utils/jwt.js';

const mockDb = {
  statusPageSettings: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
  organization: {
    findUnique: jest.fn(),
  },
  auditLog: {
    create: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    findMany: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
  },
  service: {
    findMany: jest.fn().mockResolvedValue([]),
  },
  incident: {
    findMany: jest.fn().mockResolvedValue([]),
  },
  maintenanceWindow: {
    findMany: jest.fn().mockResolvedValue([]),
  },
  $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
  $on: jest.fn(),
};

jest.unstable_mockModule('../src/config/db.js', () => ({
  default: mockDb,
}));

const { default: app } = await import('../src/app.js');

describe('Status Page Settings API Endpoints (/api/status-page-settings)', () => {
  const orgId = '11111111-1111-4111-a111-111111111111';
  const ownerUserId = '22222222-2222-4222-a222-222222222222';
  const viewerUserId = '33333333-3333-4333-a333-333333333333';

  const ownerToken = signAccessToken({ userId: ownerUserId, organizationId: orgId, role: 'owner' });
  const viewerToken = signAccessToken({ userId: viewerUserId, organizationId: orgId, role: 'viewer' });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/status-page-settings', () => {
    it('returns schema defaults if no row exists without creating a row', async () => {
      mockDb.statusPageSettings.findUnique.mockResolvedValueOnce(null);
      mockDb.organization.findUnique.mockResolvedValueOnce({
        id: orgId,
        slug: 'acme-org',
      });

      const res = await request(app)
        .get('/api/status-page-settings')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.settings).toEqual({
        id: null,
        organizationId: orgId,
        subdomain: 'acme-org',
        customDomain: null,
        logoUrl: null,
        theme: 'light',
      });
      expect(mockDb.statusPageSettings.upsert).not.toHaveBeenCalled();
    });

    it('returns existing row if already configured', async () => {
      mockDb.statusPageSettings.findUnique.mockResolvedValueOnce({
        id: 'settings-123',
        organizationId: orgId,
        subdomain: 'status.custom',
        customDomain: 'status.example.com',
        logoUrl: 'https://example.com/logo.png',
        theme: 'dark',
      });

      const res = await request(app)
        .get('/api/status-page-settings')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.settings.theme).toBe('dark');
      expect(res.body.data.settings.subdomain).toBe('status.custom');
    });
  });

  describe('PATCH /api/status-page-settings', () => {
    it('forbids viewer role from updating status page settings', async () => {
      const res = await request(app)
        .patch('/api/status-page-settings')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({ theme: 'dark' });

      expect(res.status).toBe(403);
    });

    it('allows owner/admin to update settings and logs audit entry', async () => {
      mockDb.organization.findUnique.mockResolvedValueOnce({
        id: orgId,
        slug: 'acme-org',
      });
      mockDb.statusPageSettings.upsert.mockResolvedValueOnce({
        id: 'settings-123',
        organizationId: orgId,
        subdomain: 'acme-ops',
        customDomain: 'status.acme.com',
        logoUrl: null,
        theme: 'dark',
      });

      const res = await request(app)
        .patch('/api/status-page-settings')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          subdomain: 'acme-ops',
          customDomain: 'status.acme.com',
          theme: 'dark',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockDb.statusPageSettings.upsert).toHaveBeenCalled();
      expect(mockDb.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          organizationId: orgId,
          userId: ownerUserId,
          action: 'status_page_settings.updated',
          entityType: 'StatusPageSettings',
        }),
      });
    });
  });

  describe('Public status page compatibility (/status/:slug)', () => {
    it('still serves public status page via slug parameter as before', async () => {
      mockDb.statusPageSettings.findFirst.mockResolvedValueOnce({
        id: 'settings-123',
        organizationId: orgId,
        subdomain: 'acme-public',
        theme: 'light',
      });

      const res = await request(app).get('/status/acme-public');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.settings.subdomain).toBe('acme-public');
    });
  });
});
