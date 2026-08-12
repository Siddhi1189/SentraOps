/**
 * Auth & General Middleware Test Suite
 *
 * Tests unauthenticated and validation-layer behavior without hitting the DB.
 * Prisma is mocked to avoid requiring a real Postgres connection.
 */

import { jest } from '@jest/globals';
import request from 'supertest';

// Mock Prisma BEFORE importing the app
jest.unstable_mockModule('../src/config/db.js', () => ({
  default: {
    user: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue(null),
    },
    organization: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(null),
    },
    refreshToken: {
      findUnique: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(null),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    passwordResetToken: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue(null),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    inviteToken: {
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue(null),
      update: jest.fn().mockResolvedValue(null),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
    auditLog: {
      create: jest.fn().mockResolvedValue(null),
    },
    $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
    $on: jest.fn(),
  },
}));

const { default: app } = await import('../src/app.js');

describe('Auth API Endpoints (/api/v1/auth)', () => {
  it('GET /health should return 200 and healthy status structure', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('version');
    expect(res.body).toHaveProperty('checks');
    expect(res.body.checks).toHaveProperty('api', 'healthy');
  });

  it('POST /api/v1/auth/register should fail on invalid email schema', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        organizationName: 'Test Org',
        organizationSlug: 'test-org',
        userName: 'Admin User',
        email: 'invalid-email-format',
        password: 'password123',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/auth/login should fail on missing credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'nonexistent@test.com',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/auth/forgot-password should return 200 generic message regardless of email existence', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({
        email: 'anyone@example.com',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.message).toContain('If your email is registered');
  });

  it('POST /api/v1/auth/forgot-password should return 400 on invalid email', async () => {
    const res = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({
        email: 'not-an-email',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/auth/reset-password should return 400 on invalid or expired token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/reset-password')
      .send({
        token: 'invalid-reset-token-123',
        newPassword: 'newPassword123!',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('POST /api/v1/organizations/invite/accept should return 400 on invalid or expired invite token', async () => {
    const res = await request(app)
      .post('/api/v1/organizations/invite/accept')
      .send({
        token: 'invalid-invite-token-123',
        name: 'New Member',
        password: 'newPassword123!',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_TOKEN');
  });

  it('POST /api/v1/auth/login should return 423 ACCOUNT_LOCKED if user account is locked', async () => {
    const db = (await import('../src/config/db.js')).default;
    db.user.findUnique.mockResolvedValueOnce({
      id: 'user-123',
      organizationId: 'org-123',
      email: 'locked@example.com',
      passwordHash: 'hash',
      isActive: true,
      failedLoginAttempts: 5,
      lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
    });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'locked@example.com',
        password: 'password123',
      });

    expect(res.status).toBe(423);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('ACCOUNT_LOCKED');
  });

  it('GET /api/v1/services without Bearer token should return 401 UNAUTHORIZED', async () => {
    const res = await request(app).get('/api/v1/services');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});
