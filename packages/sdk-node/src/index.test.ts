import { describe, it, expect, vi, beforeEach } from 'vitest';
import SentraOps, { init, captureException, captureMessage, expressErrorHandler, addBreadcrumb, getBreadcrumbs, clearBreadcrumbs, parseDsn } from './index';

describe('@sentraops/node SDK', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    clearBreadcrumbs();
  });

  describe('DSN parsing', () => {
    it('parses valid HTTPS DSN', () => {
      const parsed = parseDsn('https://sops_myapikey123@api.sentraops.com/proj-456');
      expect(parsed.apiKey).toBe('sops_myapikey123');
      expect(parsed.host).toBe('api.sentraops.com');
      expect(parsed.protocol).toBe('https:');
      expect(parsed.projectId).toBe('proj-456');
      expect(parsed.ingestUrl).toBe('https://api.sentraops.com/api/ingest/events');
    });

    it('parses valid HTTP DSN with port', () => {
      const parsed = parseDsn('http://sops_localkey@localhost:5000/my-proj-id');
      expect(parsed.apiKey).toBe('sops_localkey');
      expect(parsed.host).toBe('localhost:5000');
      expect(parsed.protocol).toBe('http:');
      expect(parsed.projectId).toBe('my-proj-id');
      expect(parsed.ingestUrl).toBe('http://localhost:5000/api/ingest/events');
    });

    it('throws error when API key is missing', () => {
      expect(() => parseDsn('https://api.sentraops.com/proj-123')).toThrow('Missing API key');
    });

    it('throws error when project ID is missing', () => {
      expect(() => parseDsn('https://sops_key@api.sentraops.com/')).toThrow('Missing project ID');
    });
  });

  describe('Breadcrumbs', () => {
    it('records up to maximum breadcrumbs (20) and evicts oldest', () => {
      for (let i = 1; i <= 25; i++) {
        addBreadcrumb({
          category: 'custom',
          message: `Event ${i}`,
        });
      }

      const crumbs = getBreadcrumbs();
      expect(crumbs.length).toBe(20);
      expect(crumbs[0].message).toBe('Event 6');
      expect(crumbs[19].message).toBe('Event 25');
    });
  });

  describe('captureException and captureMessage', () => {
    it('formats payload and calls global fetch non-blockingly', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 202,
      });
      global.fetch = mockFetch;

      init({
        dsn: 'https://sops_testkey@sentraops.example.com/project-uuid-123',
        environment: 'staging',
        release: 'v1.2.3',
        autoCaptureExceptions: false,
        autoCaptureRejections: false,
        captureBreadcrumbs: false,
      });

      addBreadcrumb({ category: 'custom', message: 'User clicked buy' });

      const err = new TypeError('Cannot read properties of undefined');
      captureException(err, {
        tags: { feature: 'checkout' },
        user: { id: 'u123', email: 'buyer@example.com' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://sentraops.example.com/api/ingest/events',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'x-sentraops-key': 'sops_testkey',
            'Content-Type': 'application/json',
          }),
        })
      );

      const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(sentBody.type).toBe('TypeError');
      expect(sentBody.message).toBe('Cannot read properties of undefined');
      expect(sentBody.environment).toBe('staging');
      expect(sentBody.release).toBe('v1.2.3');
      expect(sentBody.tags.feature).toBe('checkout');
      expect(sentBody.user.id).toBe('u123');
      expect(sentBody.breadcrumbs.length).toBeGreaterThan(0);
    });

    it('never throws into caller even if fetch rejects with network error', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'));

      init({
        dsn: 'https://sops_testkey@sentraops.example.com/project-uuid-123',
        autoCaptureExceptions: false,
        autoCaptureRejections: false,
        captureBreadcrumbs: false,
      });

      expect(() => {
        captureException(new Error('Test failure'));
      }).not.toThrow();
    });

    it('drops event when sampleRate is 0', () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      init({
        dsn: 'https://sops_testkey@sentraops.example.com/project-uuid-123',
        sampleRate: 0,
        autoCaptureExceptions: false,
        autoCaptureRejections: false,
      });

      captureException(new Error('Sampled out'));
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('expressErrorHandler', () => {
    it('captures error and calls next(err)', () => {
      const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 202 });
      global.fetch = mockFetch;

      init({
        dsn: 'https://sops_testkey@sentraops.example.com/project-uuid-123',
        autoCaptureExceptions: false,
        autoCaptureRejections: false,
        captureBreadcrumbs: false,
      });

      const handler = expressErrorHandler();
      const err = new Error('Database connection failed');
      const req = {
        originalUrl: '/api/checkout',
        method: 'POST',
        headers: { 'x-trace-id': 'tr-1', authorization: 'Bearer secret', cookie: 'session=abc' },
        user: { id: 'usr-42' },
      };
      const res = {};
      const next = vi.fn();

      handler(err, req, res, next);

      expect(next).toHaveBeenCalledWith(err);
      expect(mockFetch).toHaveBeenCalled();
      const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(sentBody.message).toBe('Database connection failed');
      expect(sentBody.request.url).toBe('/api/checkout');
      expect(sentBody.request.headers.authorization).toBeUndefined();
      expect(sentBody.request.headers.cookie).toBeUndefined();
      expect(sentBody.user.id).toBe('usr-42');
    });
  });
});
