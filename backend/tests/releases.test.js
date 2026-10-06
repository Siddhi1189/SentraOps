import { jest } from '@jest/globals';
import request from 'supertest';
import crypto from 'crypto';
import { generateAccessToken } from '../src/utils/jwt.js';

const mockUserId = '11111111-1111-4111-a111-111111111111';
const mockOrgId = '22222222-2222-4222-a222-222222222222';
const mockProjectId = '33333333-3333-4333-a333-333333333333';
const mockRawApiKey = 'sops_testapikey1234567890';
const mockKeyHash = crypto.createHash('sha256').update(mockRawApiKey).digest('hex');

const mockProject = {
  id: mockProjectId,
  organizationId: mockOrgId,
  name: 'Backend API',
  platform: 'node',
  environmentDefault: 'production',
};

const mockApiKey = {
  id: 'key-111',
  projectId: mockProjectId,
  name: 'CI Deployment Key',
  keyPrefix: 'sops_test',
  keyHash: mockKeyHash,
  revokedAt: null,
  project: mockProject,
};

let mockReleases = [
  {
    id: 'rel-1',
    projectId: mockProjectId,
    version: 'v1.0.0',
    commitSha: 'commit1',
    deployedAt: new Date('2026-10-01T00:00:00.000Z'),
    environment: 'production',
    createdAt: new Date('2026-10-01T00:00:00.000Z'),
  },
];

const prismaMock = {
  apiKey: {
    findUnique: jest.fn().mockImplementation(({ where }) => {
      if (where.keyHash === mockKeyHash) {
        return Promise.resolve(mockApiKey);
      }
      return Promise.resolve(null);
    }),
    update: jest.fn().mockResolvedValue({ id: 'key-111' }),
  },
  project: {
    findFirst: jest.fn().mockImplementation(({ where }) => {
      if (where.id === mockProjectId && (!where.organizationId || where.organizationId === mockOrgId)) {
        return Promise.resolve(mockProject);
      }
      return Promise.resolve(null);
    }),
    findUnique: jest.fn().mockImplementation(({ where }) => {
      if (where.id === mockProjectId) {
        return Promise.resolve(mockProject);
      }
      return Promise.resolve(null);
    }),
  },
  release: {
    upsert: jest.fn().mockImplementation(({ where, update, create }) => {
      const existingIdx = mockReleases.findIndex(
        (r) =>
          r.projectId === where.projectId_version_environment.projectId &&
          r.version === where.projectId_version_environment.version &&
          r.environment === where.projectId_version_environment.environment
      );
      if (existingIdx >= 0) {
        mockReleases[existingIdx] = {
          ...mockReleases[existingIdx],
          ...update,
        };
        return Promise.resolve(mockReleases[existingIdx]);
      }
      const newRelease = {
        id: `rel-${Date.now()}`,
        ...create,
        createdAt: new Date(),
      };
      mockReleases.push(newRelease);
      return Promise.resolve(newRelease);
    }),
    findMany: jest.fn().mockImplementation(({ where }) => {
      return Promise.resolve(mockReleases.filter((r) => r.projectId === where.projectId));
    }),
    count: jest.fn().mockImplementation(({ where }) => {
      return Promise.resolve(mockReleases.filter((r) => r.projectId === where.projectId).length);
    }),
    findUnique: jest.fn().mockImplementation(({ where }) => {
      const match = mockReleases.find(
        (r) =>
          r.projectId === where.projectId_version_environment.projectId &&
          r.version === where.projectId_version_environment.version &&
          r.environment === where.projectId_version_environment.environment
      );
      return Promise.resolve(match || null);
    }),
  },
  $on: jest.fn(),
};

jest.unstable_mockModule('../src/config/db.js', () => ({
  default: prismaMock,
  prisma: prismaMock,
}));

const { default: app } = await import('../src/app.js');

describe('Step 3.4 — Releases and Deploys Endpoints', () => {
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
    email: 'other@acme.com',
  });

  describe('POST /api/ingest/releases', () => {
    it('requires API key authentication', async () => {
      const res = await request(app)
        .post('/api/ingest/releases')
        .send({ version: 'v1.4.2' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('successfully records a release via valid API key', async () => {
      const res = await request(app)
        .post('/api/ingest/releases')
        .set('x-sentraops-key', mockRawApiKey)
        .send({
          version: 'v1.4.2',
          commitSha: '9f8e7d6c5b4a',
          environment: 'production',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.version).toBe('v1.4.2');
      expect(res.body.data.commitSha).toBe('9f8e7d6c5b4a');
      expect(res.body.data.environment).toBe('production');
      expect(res.body.data.projectId).toBe(mockProjectId);
    });

    it('fails validation when version is missing', async () => {
      const res = await request(app)
        .post('/api/ingest/releases')
        .set('x-sentraops-key', mockRawApiKey)
        .send({
          commitSha: '9f8e7d6c5b4a',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/projects/:id/releases', () => {
    it('requires JWT authentication', async () => {
      const res = await request(app).get(`/api/projects/${mockProjectId}/releases`);
      expect(res.status).toBe(401);
    });

    it('returns paginated releases for project', async () => {
      const res = await request(app)
        .get(`/api/projects/${mockProjectId}/releases`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.total).toBeDefined();
    });

    it('blocks access from another organization', async () => {
      const res = await request(app)
        .get(`/api/projects/${mockProjectId}/releases`)
        .set('Authorization', `Bearer ${otherOrgToken}`);

      expect(res.status).toBe(404);
    });
  });
});
