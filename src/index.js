import http from 'http';
import app from './app.js';
import env from './config/env.js';
import logger from './utils/logger.js';
import prisma from './config/db.js';
import { initSocket, getIO, emitToOrg } from './config/socket.js';
import { Redis } from './config/redis.js';

const server = http.createServer(app);

// Initialize Socket.IO server
initSocket(server);

// Redis subscriber for Worker-to-API pub/sub bridge
const subscriber = new Redis(env.REDIS_URL);

subscriber.subscribe('sentraops:events', (err, count) => {
  if (err) {
    logger.error(`Failed to subscribe to Redis events channel: ${err.message}`);
  } else {
    logger.info(`Subscribed to Redis events channel (${count} channel active).`);
  }
});

subscriber.on('message', (channel, message) => {
  if (channel === 'sentraops:events') {
    try {
      const { organizationId, event, data } = JSON.parse(message);
      if (organizationId && event) {
        emitToOrg(organizationId, event, data);
        logger.debug(`Relayed event '${event}' to room org_${organizationId}`);
      }
    } catch (parseErr) {
      logger.error(`Error parsing Redis pub/sub message: ${parseErr.message}`);
    }
  }
});

server.listen(env.PORT, () => {
  logger.info(`🚀 SentraOps API Server running on port ${env.PORT} (${env.NODE_ENV})`);
});

// Graceful shutdown handling
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

let isShuttingDown = false;

async function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  logger.info(`[${signal}] Received shutdown signal. Initiating graceful API shutdown...`);

  // Stop accepting new HTTP requests
  server.close(async () => {
    logger.info('HTTP Server closed to new connections.');

    try {
      // Disconnect Socket.IO server
      const io = getIO();
      if (io) {
        io.close();
        logger.info('Socket.IO server closed.');
      }

      // Disconnect Redis subscriber
      subscriber.disconnect();
      logger.info('Redis subscriber disconnected.');

      // Disconnect Prisma DB client
      await prisma.$disconnect();
      logger.info('Prisma database client disconnected.');

      logger.info('API Server shutdown completed cleanly.');
      process.exit(0);
    } catch (err) {
      logger.error(`Error during API graceful shutdown: ${err.message}`);
      process.exit(1);
    }
  });

  // Force exit after 10 seconds if graceful shutdown hangs
  setTimeout(() => {
    logger.error('Forced API shutdown due to timeout.');
    process.exit(1);
  }, 10000);
}
