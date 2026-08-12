import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { healthCheckQueue, notificationQueue, maintenanceQueue } from './queue.js';
import env from './env.js';
import logger from '../utils/logger.js';

/**
 * Configure Bull Board dashboard for monitoring queues in development mode
 * @param {import('express').Express} app 
 */
function setupBullBoard(app) {
  if (env.NODE_ENV !== 'development') {
    logger.info('Bull Board dashboard disabled in non-development environment.');
    return;
  }

  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: [
      new BullMQAdapter(healthCheckQueue),
      new BullMQAdapter(notificationQueue),
      new BullMQAdapter(maintenanceQueue),
    ],
    serverAdapter,
  });

  app.use('/admin/queues', serverAdapter.getRouter());
  logger.info('📊 Bull Board queue dashboard mounted at /admin/queues (Development Only)');
}

export { setupBullBoard };
export default { setupBullBoard };
