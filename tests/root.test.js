/**
 * Root and fallback route tests.
 */

import { jest } from '@jest/globals';
import request from 'supertest';

jest.unstable_mockModule('../src/config/db.js', () => ({
  default: {
    $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
    $on: jest.fn(),
  },
}));

const { default: app } = await import('../src/app.js');

describe('Root and fallback routes', () => {
  it('GET / should return the API landing payload', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      name: 'SentraOps API',
      status: 'running',
      apiBasePath: '/api/v1',
      docs: '/api/v1/docs',
      health: '/health',
    });
  });

  it('GET /unknown should return a JSON 404 instead of Express default text', async () => {
    const res = await request(app).get('/unknown');

    expect(res.status).toBe(404);
    expect(res.type).toMatch(/json/);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('ROUTE_NOT_FOUND');
    expect(res.text).not.toContain('Cannot GET');
  });
});
