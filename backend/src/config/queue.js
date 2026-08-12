import { Queue } from 'bullmq';
import Redis from 'ioredis';
import env from './env.js';
import logger from '../utils/logger.js';

const connection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

connection.on('error', (err) => {
  logger.error(`BullMQ Redis connection error: ${err.message}`);
});

// Dedicated Queue 1: Health-check scheduling and execution queue
const healthCheckQueue = new Queue('health-check', {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 200 },
  },
});

// Dedicated Queue 2: Notification dispatch queue
const notificationQueue = new Queue('notifications', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 200 },
    removeOnFail: { count: 100 },
  },
});

// Dedicated Queue 3: Maintenance & Escalation queue
const maintenanceQueue = new Queue('maintenance', {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'fixed', delay: 3000 },
    removeOnComplete: true,
    removeOnFail: { count: 50 },
  },
});

/**
 * Register or update a repeating health-check job for a service.
 * Supports configurable intervals (e.g. 30s, 60s, 300s, 600s).
 * @param {Object} service
 */
async function registerServiceJob(service) {
  const jobId = `hc:${service.id}`;
  const intervalMs = (service.checkIntervalSeconds || 60) * 1000;

  // Clear any existing repeatable job for this service first to avoid duplicate schedules
  await removeServiceJob(service.id);

  await healthCheckQueue.add(
    'check',
    { serviceId: service.id },
    {
      repeat: { every: intervalMs },
      jobId,
    }
  );

  logger.info(`Registered monitoring job for service ${service.id} (Interval: ${service.checkIntervalSeconds}s)`);
}

/**
 * Remove the repeating health-check job for a service.
 * @param {string} serviceId
 */
async function removeServiceJob(serviceId) {
  const repeatableJobs = await healthCheckQueue.getRepeatableJobs();
  const targetJob = repeatableJobs.find((j) => j.id === `hc:${serviceId}`);
  if (targetJob) {
    await healthCheckQueue.removeRepeatableByKey(targetJob.key);
    logger.info(`Removed monitoring job for service ${serviceId}`);
  }
}

/**
 * Enqueue a notification task
 * @param {Object} payload
 */
async function enqueueNotification(payload) {
  return notificationQueue.add('send', payload);
}

/**
 * Enqueue a maintenance status check task
 * @param {Object} payload
 * @param {number} [delayMs]
 */
async function enqueueMaintenanceCheck(payload, delayMs = 0) {
  return maintenanceQueue.add('check', payload, { delay: delayMs });
}

export { healthCheckQueue, notificationQueue, maintenanceQueue, registerServiceJob, removeServiceJob, enqueueNotification, enqueueMaintenanceCheck };
export default {
  healthCheckQueue,
  notificationQueue,
  maintenanceQueue,
  registerServiceJob,
  removeServiceJob,
  enqueueNotification,
  enqueueMaintenanceCheck,
};
