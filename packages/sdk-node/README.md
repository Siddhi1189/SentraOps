# @sentraops/node

Official SentraOps Node.js SDK for real-time error tracking, exception diagnostics, and service reliability monitoring.

## Features

- 🚀 **Zero runtime dependencies**: Lightweight and fast, using Node.js built-ins.
- 📦 **Dual ESM & CJS support**: TypeScript type definitions included out of the box.
- 🛡️ **Fail-safe design**: Non-blocking asynchronous network transport that never crashes or throws into your host application.
- 🍞 **Automatic breadcrumbs**: Automatically captures outgoing HTTP calls and console logs.
- ⚡ **Express integration**: One-line Express error handling middleware.

## Installation

```bash
npm install @sentraops/node
```

## Initialization

Initialize SentraOps as early as possible in your application lifecycle (before requiring other modules):

```javascript
import SentraOps from '@sentraops/node';

SentraOps.init({
  dsn: 'https://sops_yourApiKey@api.sentraops.com/your-project-id',
  environment: process.env.NODE_ENV || 'production',
  release: '1.0.0',
  sampleRate: 1.0, // Optional: float between 0.0 and 1.0
  autoCaptureExceptions: true,
  autoCaptureRejections: true,
  captureBreadcrumbs: true,
});
```

### DSN Format

The DSN (Data Source Name) tells the SDK where to send events:

```
https://<apiKey>@<host>/<projectId>
```

- `<apiKey>`: The project API key generated from the SentraOps dashboard (`sops_...`).
- `<host>`: The domain or IP (and optional port) of your SentraOps backend.
- `<projectId>`: The target project UUID.

## Express Integration Example

```javascript
import express from 'express';
import SentraOps from '@sentraops/node';

SentraOps.init({
  dsn: process.env.SENTRAOPS_DSN,
  environment: process.env.NODE_ENV || 'production',
});

const app = express();

app.get('/api/orders', (req, res) => {
  throw new Error('Payment gateway timeout');
});

// Attach the SentraOps error handler BEFORE any other error handlers
app.use(SentraOps.expressErrorHandler());

// Your default error handler
app.use((err, req, res, next) => {
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
```

## Manual Capture

You can manually report caught exceptions or custom diagnostic messages:

```javascript
try {
  parseConfigFile();
} catch (error) {
  SentraOps.captureException(error, {
    tags: { component: 'config-loader' },
    user: { id: 'usr_123', email: 'alice@example.com' },
    extra: { path: '/etc/app.json' },
  });
}

// Capture diagnostic messages
SentraOps.captureMessage('Worker queue depth high', 'warning');
```

## Limits

- **Body Size**: Event payloads are restricted to a maximum of 100 KB.
- **Stack Trace**: Stack traces are capped at 20,000 characters.
- **Breadcrumbs**: In-memory ring buffer retains the most recent 20 breadcrumbs per event.
- **Retry Queue**: In the event of transient network drops or backend downtime, up to 30 events are held in an in-memory queue with automatic retry backoff.
- **Rate Limit**: Project ingest endpoints enforce rate limiting per API key (default 100 events/minute) with standard `429 Too Many Requests` responses.
