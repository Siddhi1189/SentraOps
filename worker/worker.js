import { Worker } from 'bullmq';
import env from '../src/config/env.js';
import logger from '../src/utils/logger.js';
import prisma from '../src/config/db.js';
import { Redis } from '../src/config/redis.js';
import ServiceRepository from '../src/repositories/service.repository.js';
import { registerServiceJob } from '../src/config/queue.js';

import { processHealthCheckJob } from './processors/healthCheck.processor.js';
import { processNotificationJob } from './processors/notification.processor.js';
import { processMaintenanceJob } from './processors/maintenance.processor.js';
import { processCleanupJob } from './processors/cleanup.processor.js';

// Redis publisher client for sending event messages to the API server pub/sub bridge
const publisher = new Redis(env.REDIS_URL);

/**
 * Publish real-time events to the Redis pub/sub channel
 * @param {string} organizationId 
 * @param {string} event 
 * @param {Object} data 
 */
function publishEvent(organizationId, event, data) {
  const payload = JSON.stringify({ organizationId, event, data });
  publisher.publish('sentraops:events', payload);
}

const connection = {
  url: env.REDIS_URL,
  maxRetriesPerRequest: null,
};

// 1. Dedicated Health-check queue worker
const healthCheckWorker = new Worker(
  'health-check',
  async (job) => {
    logger.debug(`Processing health check job: ${job.id} for service ${job.data.serviceId}`, {
      jobId: job.id,
      serviceId: job.data.serviceId,
      workerName: 'healthCheckWorker',
    });
    await processHealthCheckJob(job, publishEvent);
  },
  { connection, concurrency: 10 }
);

// 2. Dedicated Notification queue worker
const notificationWorker = new Worker(
  'notifications',
  async (job) => {
    logger.debug(`Processing notification job: ${job.id}`, {
      jobId: job.id,
      workerName: 'notificationWorker',
    });
    await processNotificationJob(job);
  },
  { connection, concurrency: 5 }
);

// 3. Dedicated Maintenance queue worker
const maintenanceWorker = new Worker(
  'maintenance',
  async (job) => {
    logger.debug(`Processing maintenance job: ${job.id}`, {
      jobId: job.id,
      workerName: 'maintenanceWorker',
    });
    await processMaintenanceJob(job, publishEvent);
  },
  { connection, concurrency: 2 }
);

// Synchronize all active services on startup
async function syncActiveServiceJobs() {
  try {
    const activeServices = await ServiceRepository.findActiveServicesForWorker();
    logger.info(`Syncing ${activeServices.length} active service monitoring jobs...`);
    for (const service of activeServices) {
      await registerServiceJob(service);
    }
    logger.info('Finished syncing monitoring jobs.');
  } catch (err) {
    logger.error(`Error syncing active services: ${err.message}`);
  }
}

// Periodic ticker for maintenance window transitions (every 30 seconds)
const maintenanceInterval = setInterval(async () => {
  try {
    await processMaintenanceJob({}, publishEvent);
  } catch (err) {
    logger.error(`Error running maintenance ticker: ${err.message}`);
  }
}, 30 * 1000);

// Periodic ticker for data retention cleanup (every 24 hours)
const cleanupInterval = setInterval(async () => {
  try {
    await processCleanupJob();
  } catch (err) {
    logger.error(`Error running cleanup ticker: ${err.message}`);
  }
}, 24 * 60 * 60 * 1000);

// Initialize worker
logger.info('⚡ SentraOps Worker Process initialized and listening for jobs.');
syncActiveServiceJobs();
processCleanupJob();

// Graceful shutdown handling
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

let isShuttingDown = false;

async function shutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`[${signal}] Received shutdown signal. Initiating graceful Worker shutdown...`);
  clearInterval(maintenanceInterval);
  clearInterval(cleanupInterval);

  try {
    logger.info('Closing BullMQ workers (waiting for active jobs to complete)...');
    await Promise.all([
      healthCheckWorker.close(),
      notificationWorker.close(),
      maintenanceWorker.close(),
    ]);
    logger.info('All BullMQ workers closed.');

    publisher.disconnect();
    logger.info('Redis publisher disconnected.');

    await prisma.$disconnect();
    logger.info('Prisma database client disconnected.');

    logger.info('Worker process shutdown completed cleanly.');
    process.exit(0);
  } catch (err) {
    logger.error(`Error during Worker graceful shutdown: ${err.message}`);
    process.exit(1);
  }
}
