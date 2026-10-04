import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import * as SentraOps from '@sentraops/node';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4050;
const DSN = process.env.SENTRAOPS_DSN;
const SLOW_DELAY_MS = Number(process.env.SLOW_DELAY_MS) || 2500;

// Initialize SentraOps Node SDK if DSN is configured
if (DSN) {
  SentraOps.init({
    dsn: DSN,
    environment: process.env.NODE_ENV || 'production',
    release: process.env.RELEASE || 'demo-shop@1.0.0',
  });
  console.log(`[SentraOps] Initialized Node SDK with DSN: ${DSN.replace(/:[^@]+@/, ':****@')}`);
} else {
  console.warn('[SentraOps] SENTRAOPS_DSN is not set. Events will not be transmitted to SentraOps ingest.');
}

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Outage toggle state (controls GET /health return code)
let isHealthDown = false;

// 1. GET /health (returns 200 or 500 when outage is simulated)
app.get('/health', (req, res) => {
  if (isHealthDown) {
    return res.status(500).json({
      status: 'down',
      error: 'Simulated service failure: database connection dropped',
      timestamp: new Date().toISOString(),
    });
  }
  return res.status(200).json({
    status: 'up',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// 2. GET /api/products (returns 200 product list)
app.get('/api/products', (req, res) => {
  res.json({
    success: true,
    data: [
      { id: 'prod-001', name: 'Wireless Mechanical Keyboard', price: 129.99, inStock: true },
      { id: 'prod-002', name: 'Ultra-wide 4K Monitor 34"', price: 499.99, inStock: true },
      { id: 'prod-003', name: 'Noise-Cancelling Studio Headphones', price: 249.99, inStock: false },
      { id: 'prod-004', name: 'Ergonomic Desk Chair', price: 349.5, inStock: true },
    ],
  });
});

// 3. GET /api/slow (waits a configurable delay)
app.get('/api/slow', async (req, res) => {
  const delay = Number(req.query.delay) || SLOW_DELAY_MS;
  console.log(`[DemoShop] Simulating slow request: waiting ${delay}ms...`);
  await new Promise((resolve) => setTimeout(resolve, delay));
  res.json({
    success: true,
    message: `Response completed after delay of ${delay}ms`,
    delayMs: delay,
  });
});

// 4. GET /api/error (throws error caught and reported by SDK error handler)
app.get('/api/error', (req, res, next) => {
  console.log('[DemoShop] Triggering intentional error: PaymentGatewayException');
  const error = new Error('PaymentGatewayException: Upstream payment processor timed out during checkout handshake');
  error.name = 'PaymentGatewayException';
  // Express passes error to next() or throws into expressErrorHandler
  throw error;
});

// 5. GET /api/crash-db (simulates database failure, calls captureException directly, returns 500)
app.get('/api/crash-db', (req, res) => {
  console.log('[DemoShop] Triggering database crash simulation');
  const dbError = new Error('DatabaseConnectionTimeout: Connection pool exhausted (active=50, idle=0, queued=128)');
  dbError.name = 'DatabaseConnectionTimeout';

  if (DSN) {
    SentraOps.captureException(dbError, {
      tags: { component: 'postgres-pool', poolSize: '50' },
      user: { id: 'usr-demo-99', email: 'customer@demoshop.com' },
    });
  }

  res.status(500).json({
    success: false,
    error: 'DatabaseConnectionTimeout',
    message: dbError.message,
  });
});

// 6. POST /api/toggle-down (switches /health to 500 and back)
app.post('/api/toggle-down', (req, res) => {
  isHealthDown = !isHealthDown;
  console.log(`[DemoShop] Outage state changed: isHealthDown = ${isHealthDown}`);
  res.json({
    success: true,
    isHealthDown,
    message: isHealthDown
      ? 'Outage simulated: /health is now returning 500'
      : 'Service recovered: /health is now returning 200',
  });
});

// Config endpoint for client UI to query state
app.get('/api/status', (req, res) => {
  res.json({
    isHealthDown,
    hasDsn: !!DSN,
    dsn: DSN ? DSN.replace(/:[^@]+@/, ':****@') : null,
    port: PORT,
  });
});

// SDK Express Error Handler (must be mounted before fallback error handler)
if (DSN) {
  app.use(SentraOps.expressErrorHandler());
}

// Fallback Express error handler
app.use((err, req, res, next) => {
  res.status(500).json({
    success: false,
    error: err.name || 'Error',
    message: err.message || 'An unexpected internal error occurred',
  });
});

app.listen(PORT, () => {
  console.log(`🛒 SentraOps Demo Target App running on http://localhost:${PORT}`);
});
