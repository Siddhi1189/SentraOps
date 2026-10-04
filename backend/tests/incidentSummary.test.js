import { jest } from '@jest/globals';
import request from 'supertest';
import { signAccessToken } from '../src/utils/jwt.js';

const mockIncident = {
  id: '11111111-1111-4111-8111-111111111111',
  organizationId: '33333333-3333-4333-a333-333333333333',
  serviceId: '22222222-2222-4222-a222-222222222222',
  title: 'Database connection failure',
  status: 'open',
  severity: 'high',
  rootCause: null,
  resolutionNotes: null,
  detectedAt: new Date('2026-10-04T10:00:00Z'),
  resolvedAt: null,
  aiSummary: null,
  service: {
    id: '22222222-2222-4222-a222-222222222222',
    name: 'Main DB',
    url: 'https://db.internal',
    currentStatus: 'down',
  },
  timelineEvents: [
    {
      id: 'te-1',
      eventType: 'created',
      description: 'Incident opened',
      createdAt: new Date('2026-10-04T10:00:00Z'),
    },
  ],
};

jest.unstable_mockModule('../src/config/db.js', () => ({
  default: {
    incident: {
      findFirst: jest.fn().mockImplementation(({ where }) => {
        if (where?.id === mockIncident.id) {
          return Promise.resolve(mockIncident);
        }
        return Promise.resolve(null);
      }),
      update: jest.fn().mockResolvedValue(mockIncident),
    },
    healthCheck: {
      findMany: jest.fn().mockResolvedValue([
        {
          id: 'hc-1',
          status: 'down',
          httpStatusCode: 500,
          responseTimeMs: 350,
          errorMessage: 'Connection refused',
          checkedAt: new Date('2026-10-04T10:01:00Z'),
        },
      ]),
      count: jest.fn().mockResolvedValue(1),
    },
    service: {
      findFirst: jest.fn().mockResolvedValue({ id: mockIncident.serviceId }),
    },
    $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
    $on: jest.fn(),
  },
}));

const { default: app } = await import('../src/app.js');

describe('AI Incident Summary POST /api/incidents/:id/summary', () => {
  const mockOrgId = '33333333-3333-4333-a333-333333333333';
  const mockUserId = '44444444-4444-4444-a444-444444444444';
  const adminToken = signAccessToken({ userId: mockUserId, organizationId: mockOrgId, role: 'admin' });
  const viewerToken = signAccessToken({ userId: mockUserId, organizationId: mockOrgId, role: 'viewer' });

  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    jest.restoreAllMocks();
  });

  it('returns 503 if ANTHROPIC_API_KEY is not configured', async () => {
    delete process.env.ANTHROPIC_API_KEY;

    const res = await request(app)
      .post(`/api/incidents/${mockIncident.id}/summary`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(503);
    expect(res.body.error?.message || res.body.message).toMatch(/ANTHROPIC_API_KEY/i);
  });

  it('rejects viewer role with 403', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-key';

    const res = await request(app)
      .post(`/api/incidents/${mockIncident.id}/summary`)
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(403);
  });

  it('calls Anthropic API and caches generated summary', async () => {
    process.env.ANTHROPIC_API_KEY = 'test-mock-key';
    process.env.ANTHROPIC_MODEL = 'claude-sonnet-5-5';

    const mockSummary = 'Root cause was connection pool exhaustion. Mitigation: increased pool size.';

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: [{ type: 'text', text: mockSummary }],
      }),
    });

    const res = await request(app)
      .post(`/api/incidents/${mockIncident.id}/summary`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.summary).toBe(mockSummary);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.anthropic.com/v1/messages',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-api-key': 'test-mock-key',
        }),
      })
    );
  });
});
