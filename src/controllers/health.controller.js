import prisma from '../config/db.js';
import Redis from 'ioredis';
import { createRequire } from 'module';
import env from '../config/env.js';

const require = createRequire(import.meta.url);
const pkg = require('../../package.json');

/**
 * Comprehensive health check controller
 * Probes PostgreSQL, Redis, uptime, version without exposing sensitive data
 */
async function getHealth(req, res) {
  const startTime = Date.now();
  let dbStatus = 'unhealthy';
  let redisStatus = 'unhealthy';

  // 1. Check PostgreSQL Database Connectivity
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'healthy';
  } catch (_err) {
    dbStatus = 'unhealthy';
  }

  // 2. Check Redis Connectivity (ephemeral probe connection — no module-level client)
  try {
    const redisProbe = new Redis(env.REDIS_URL, {
      lazyConnect: true,
      enableOfflineQueue: false,
      connectTimeout: 2000,
      maxRetriesPerRequest: 0,
    });
    await redisProbe.connect();
    const pingResult = await redisProbe.ping();
    redisStatus = pingResult === 'PONG' ? 'healthy' : 'unhealthy';
    await redisProbe.quit().catch(() => {});
  } catch (_err) {
    redisStatus = 'unhealthy';
  }

  const isHealthy = dbStatus === 'healthy' && redisStatus === 'healthy';
  const responseTimeMs = Date.now() - startTime;

  const payload = {
    status: isHealthy ? 'healthy' : 'degraded',
    version: pkg.version || '1.0.0',
    environment: env.NODE_ENV,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    checks: {
      api: 'healthy',
      database: dbStatus,
      redis: redisStatus,
      worker: 'listening',
    },
    latencyMs: responseTimeMs,
  };

  return res.status(isHealthy ? 200 : 503).json(payload);
}

export { getHealth };
export default { getHealth };
