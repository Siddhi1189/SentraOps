import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

// Global singleton pattern to prevent multiple PrismaClient instances during hot-reloads or multi-module imports
let prisma;

if (global.__sentraops_prisma__) {
  prisma = global.__sentraops_prisma__;
} else {
  prisma = new PrismaClient({
    log: [
      { level: 'query', emit: 'event' },
      { level: 'info', emit: 'stdout' },
      { level: 'warn', emit: 'stdout' },
      { level: 'error', emit: 'stdout' },
    ],
  });

  if (process.env.NODE_ENV !== 'production') {
    global.__sentraops_prisma__ = prisma;
  }

  prisma.$on('query', (e) => {
    logger.debug(`Prisma Query: ${e.query} | Duration: ${e.duration}ms`);
  });
}

export default prisma;
