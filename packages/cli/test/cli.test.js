import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseDsn, parseArgs, runCli } from '../src/cli.js';

describe('SentraOps CLI', () => {
  it('parses DSN correctly', () => {
    const dsn = 'https://sops_abc123@api.sentraops.com/proj-123';
    const parsed = parseDsn(dsn);
    assert.strictEqual(parsed.apiKey, 'sops_abc123');
    assert.strictEqual(parsed.projectId, 'proj-123');
    assert.strictEqual(parsed.ingestUrl, 'https://api.sentraops.com/api/ingest/events');
  });

  it('runs test-event and prints HTTP result', async () => {
    let capturedUrl = '';
    let capturedHeaders = {};
    let capturedBody = null;

    const mockFetch = async (url, opts) => {
      capturedUrl = url;
      capturedHeaders = opts.headers;
      capturedBody = JSON.parse(opts.body);
      return {
        status: 202,
        ok: true,
        text: async () => JSON.stringify({ success: true, eventId: 'evt-1' }),
      };
    };

    const code = await runCli(
      ['test-event', '--dsn', 'https://sops_mykey@localhost:4000/my-proj', '--message', 'Hello CLI'],
      mockFetch
    );

    assert.strictEqual(code, 0);
    assert.strictEqual(capturedUrl, 'https://localhost:4000/api/ingest/events');
    assert.strictEqual(capturedHeaders['x-sentraops-key'], 'sops_mykey');
    assert.strictEqual(capturedBody.message, 'Hello CLI');
  });
});
