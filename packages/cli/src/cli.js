export function parseDsn(dsn) {
  const url = new URL(dsn);
  const apiKey = url.username;
  if (!apiKey) {
    throw new Error('Invalid DSN: Missing API key in username component');
  }
  const host = url.host;
  const protocol = url.protocol;
  const projectId = url.pathname.replace(/^\/+/, '');
  if (!projectId) {
    throw new Error('Invalid DSN: Missing project ID in path');
  }
  const ingestUrl = `${protocol}//${host}/api/ingest/events`;
  return { apiKey, host, protocol, projectId, ingestUrl };
}

export function parseArgs(args) {
  const command = args[0];
  let dsn = null;
  let message = 'Test event from SentraOps CLI';

  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--dsn' && i + 1 < args.length) {
      dsn = args[++i];
    } else if (args[i] === '--message' && i + 1 < args.length) {
      message = args[++i];
    }
  }

  return { command, dsn, message };
}

export async function runCli(args, customFetch = fetch) {
  const { command, dsn, message } = parseArgs(args);

  if (command !== 'test-event') {
    console.error('Usage: sentraops test-event --dsn <dsn> [--message <text>]');
    return 1;
  }

  if (!dsn) {
    console.error('Error: --dsn is required');
    return 1;
  }

  const parsed = parseDsn(dsn);
  const payload = {
    projectId: parsed.projectId,
    type: 'CLIEvent',
    message,
    level: 'info',
    environment: 'production',
    occurredAt: new Date().toISOString(),
  };

  const res = await customFetch(parsed.ingestUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-sentraops-key': parsed.apiKey,
    },
    body: JSON.stringify(payload),
  });

  const responseText = await res.text();
  console.log(`HTTP ${res.status}: ${responseText}`);
  return res.ok ? 0 : 1;
}
