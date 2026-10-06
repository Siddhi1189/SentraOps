import { jest } from '@jest/globals';
import request from 'supertest';
import { evaluateAssertions } from '../src/utils/assertionEvaluator.js';
import {
  maskRequestHeaders,
  mergeRequestHeaders,
  maskServiceSecrets,
  isSensitiveHeader,
  isMaskedHeaderValue,
} from '../src/utils/maskSecret.js';
import { createServiceSchema } from '../src/controllers/validators/service.validators.js';

// Mock DB for route testing
const mockService = {
  id: '33333333-3333-4333-a333-333333333333',
  organizationId: '11111111-1111-4111-a111-111111111111',
  name: 'Cron Ping Monitor',
  monitorType: 'heartbeat',
  url: null,
  heartbeatToken: 'test-heartbeat-token-xyz',
  heartbeatIntervalSeconds: 60,
  heartbeatGraceSeconds: 30,
  lastHeartbeatAt: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

jest.unstable_mockModule('../src/config/db.js', () => ({
  default: {
    service: {
      findUnique: jest.fn().mockImplementation(({ where }) => {
        if (where.heartbeatToken === 'test-heartbeat-token-xyz') {
          return Promise.resolve(mockService);
        }
        return Promise.resolve(null);
      }),
      update: jest.fn().mockImplementation(({ where, data }) => {
        return Promise.resolve({ ...mockService, ...data });
      }),
    },
    $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
    $on: jest.fn(),
  },
}));

jest.unstable_mockModule('../src/config/queue.js', () => ({
  healthCheckQueue: {
    add: jest.fn().mockResolvedValue({ id: 'mock-job' }),
  },
  notificationQueue: {
    add: jest.fn().mockResolvedValue({ id: 'mock-job' }),
  },
  maintenanceQueue: {
    add: jest.fn().mockResolvedValue({ id: 'mock-job' }),
  },
  ingestQueue: {
    add: jest.fn().mockResolvedValue({ id: 'mock-job' }),
  },
  registerServiceJob: jest.fn().mockResolvedValue(true),
  removeServiceJob: jest.fn().mockResolvedValue(true),
  enqueueNotification: jest.fn().mockResolvedValue(true),
  enqueueMaintenanceCheck: jest.fn().mockResolvedValue(true),
  enqueueIngestEvent: jest.fn().mockResolvedValue(true),
  default: {
    healthCheckQueue: { add: jest.fn().mockResolvedValue({ id: 'mock-job' }) },
    notificationQueue: { add: jest.fn().mockResolvedValue({ id: 'mock-job' }) },
    maintenanceQueue: { add: jest.fn().mockResolvedValue({ id: 'mock-job' }) },
    ingestQueue: { add: jest.fn().mockResolvedValue({ id: 'mock-job' }) },
    registerServiceJob: jest.fn().mockResolvedValue(true),
    removeServiceJob: jest.fn().mockResolvedValue(true),
    enqueueNotification: jest.fn().mockResolvedValue(true),
    enqueueMaintenanceCheck: jest.fn().mockResolvedValue(true),
    enqueueIngestEvent: jest.fn().mockResolvedValue(true),
  },
}));

const { default: app } = await import('../src/app.js');

describe('Step 3.1: Richer Monitor Types & Assertions', () => {
  describe('Assertion Evaluator (evaluateAssertions)', () => {
    it('returns passed: true for empty assertions', () => {
      const result = evaluateAssertions([], { httpStatusCode: 200, responseTimeMs: 150, bodyString: 'OK' });
      expect(result.passed).toBe(true);
      expect(result.failedAssertion).toBeNull();
    });

    it('evaluates status_code_equals correctly', () => {
      const passResult = evaluateAssertions(
        [{ kind: 'status_code_equals', value: 201 }],
        { httpStatusCode: 201, responseTimeMs: 100, bodyString: '' }
      );
      expect(passResult.passed).toBe(true);

      const failResult = evaluateAssertions(
        [{ kind: 'status_code_equals', value: 200 }],
        { httpStatusCode: 500, responseTimeMs: 100, bodyString: '' }
      );
      expect(failResult.passed).toBe(false);
      expect(failResult.failedAssertion.kind).toBe('status_code_equals');
      expect(failResult.errorMessage).toContain('Status code 500 did not match expected 200');
    });

    it('evaluates body_contains correctly', () => {
      const pass = evaluateAssertions(
        [{ kind: 'body_contains', value: 'healthy' }],
        { httpStatusCode: 200, responseTimeMs: 100, bodyString: '{"status":"healthy","uptime":99}' }
      );
      expect(pass.passed).toBe(true);

      const fail = evaluateAssertions(
        [{ kind: 'body_contains', value: 'healthy' }],
        { httpStatusCode: 200, responseTimeMs: 100, bodyString: '{"status":"degraded"}' }
      );
      expect(fail.passed).toBe(false);
      expect(fail.errorMessage).toContain('does not contain keyword "healthy"');
    });

    it('evaluates body_does_not_contain correctly', () => {
      const pass = evaluateAssertions(
        [{ kind: 'body_does_not_contain', value: 'FATAL_ERROR' }],
        { httpStatusCode: 200, responseTimeMs: 100, bodyString: '{"status":"ok"}' }
      );
      expect(pass.passed).toBe(true);

      const fail = evaluateAssertions(
        [{ kind: 'body_does_not_contain', value: 'FATAL_ERROR' }],
        { httpStatusCode: 200, responseTimeMs: 100, bodyString: 'FATAL_ERROR: db connection refused' }
      );
      expect(fail.passed).toBe(false);
      expect(fail.errorMessage).toContain('contains forbidden keyword "FATAL_ERROR"');
    });

    it('evaluates json_path_equals with JSONPath query', () => {
      const body = JSON.stringify({ app: { status: 'ready', version: '2.4.0' } });

      const pass = evaluateAssertions(
        [{ kind: 'json_path_equals', path: '$.app.status', value: 'ready' }],
        { httpStatusCode: 200, responseTimeMs: 100, bodyString: body }
      );
      expect(pass.passed).toBe(true);

      const failVal = evaluateAssertions(
        [{ kind: 'json_path_equals', path: '$.app.status', value: 'maintenance' }],
        { httpStatusCode: 200, responseTimeMs: 100, bodyString: body }
      );
      expect(failVal.passed).toBe(false);
      expect(failVal.errorMessage).toContain('did not match expected');

      const failPath = evaluateAssertions(
        [{ kind: 'json_path_equals', path: '$.app.nonexistent', value: 'something' }],
        { httpStatusCode: 200, responseTimeMs: 100, bodyString: body }
      );
      expect(failPath.passed).toBe(false);
      expect(failPath.errorMessage).toContain('returned no matching elements');

      const failJson = evaluateAssertions(
        [{ kind: 'json_path_equals', path: '$.app', value: 'ready' }],
        { httpStatusCode: 200, responseTimeMs: 100, bodyString: 'not-json-content' }
      );
      expect(failJson.passed).toBe(false);
      expect(failJson.errorMessage).toContain('Response body is not valid JSON');
    });

    it('evaluates response_time_less_than correctly', () => {
      const pass = evaluateAssertions(
        [{ kind: 'response_time_less_than', value: 500 }],
        { httpStatusCode: 200, responseTimeMs: 250, bodyString: '' }
      );
      expect(pass.passed).toBe(true);

      const fail = evaluateAssertions(
        [{ kind: 'response_time_less_than', value: 500 }],
        { httpStatusCode: 200, responseTimeMs: 800, bodyString: '' }
      );
      expect(fail.passed).toBe(false);
      expect(fail.errorMessage).toContain('800ms exceeded threshold 500ms');
    });
  });

  describe('Secret Header Masking & Merging', () => {
    it('identifies sensitive headers accurately', () => {
      expect(isSensitiveHeader('Authorization')).toBe(true);
      expect(isSensitiveHeader('x-api-key')).toBe(true);
      expect(isSensitiveHeader('Cookie')).toBe(true);
      expect(isSensitiveHeader('X-Custom-Header')).toBe(false);
      expect(isSensitiveHeader('Content-Type')).toBe(false);
    });

    it('masks secret header values in request headers', () => {
      const headers = {
        'Content-Type': 'application/json',
        Authorization: 'Bearer secret_token_12345',
        'X-Api-Key': 'my-super-secret-key',
      };
      const masked = maskRequestHeaders(headers);
      expect(masked['Content-Type']).toBe('application/json');
      expect(masked.Authorization).toBe('Bear...****');
      expect(masked['X-Api-Key']).toBe('my-s...****');
      expect(masked.Authorization).not.toContain('secret_token_12345');
    });

    it('merges updated headers preserving existing secrets when client sends mask', () => {
      const existing = {
        Authorization: 'Bearer real_secret_99999',
        'X-Custom': 'old_value',
      };
      const incoming = {
        Authorization: 'Bear...****',
        'X-Custom': 'new_value',
      };
      const merged = mergeRequestHeaders(existing, incoming);
      expect(merged.Authorization).toBe('Bearer real_secret_99999');
      expect(merged['X-Custom']).toBe('new_value');
    });

    it('masks secrets on service object', () => {
      const service = {
        id: 'svc-1',
        name: 'Internal API',
        requestHeaders: {
          Authorization: 'Bearer token123',
        },
      };
      const masked = maskServiceSecrets(service);
      expect(masked.requestHeaders.Authorization).toBe('Bear...****');
    });
  });

  describe('Service Zod Validation (Max 10 assertions & Heartbeats)', () => {
    it('accepts valid assertions up to 10', () => {
      const assertions = Array.from({ length: 10 }, (_, i) => ({
        kind: 'response_time_less_than',
        value: 1000 + i,
      }));
      const parsed = createServiceSchema.safeParse({
        name: 'Valid Service',
        url: 'https://example.com/api',
        assertions,
      });
      expect(parsed.success).toBe(true);
    });

    it('rejects more than 10 assertions (Q4 limit)', () => {
      const assertions = Array.from({ length: 11 }, () => ({
        kind: 'response_time_less_than',
        value: 1000,
      }));
      const parsed = createServiceSchema.safeParse({
        name: 'Invalid Service',
        url: 'https://example.com/api',
        assertions,
      });
      expect(parsed.success).toBe(false);
      expect(parsed.error.issues[0].message).toContain('Maximum 10 assertions');
    });

    it('requires URL when monitorType is http', () => {
      const parsed = createServiceSchema.safeParse({
        name: 'HTTP Service',
        monitorType: 'http',
        url: null,
      });
      expect(parsed.success).toBe(false);
      expect(parsed.error.issues[0].path).toContain('url');
    });

    it('allows URL to be null when monitorType is heartbeat', () => {
      const parsed = createServiceSchema.safeParse({
        name: 'Heartbeat Service',
        monitorType: 'heartbeat',
        url: null,
        heartbeatIntervalSeconds: 60,
      });
      expect(parsed.success).toBe(true);
    });
  });

  describe('Heartbeat Inbound Ping Endpoint (/api/heartbeat/:token)', () => {
    it('GET /api/heartbeat/:token records ping and returns 200', async () => {
      const res = await request(app).get('/api/heartbeat/test-heartbeat-token-xyz');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ok');
      expect(res.body.data.message).toContain('Heartbeat recorded');
    });

    it('POST /api/heartbeat/:token records ping and returns 200', async () => {
      const res = await request(app).post('/api/heartbeat/test-heartbeat-token-xyz');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ok');
    });

    it('returns 404 for unknown heartbeat token', async () => {
      const res = await request(app).get('/api/heartbeat/non-existent-token-1234');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });
});
