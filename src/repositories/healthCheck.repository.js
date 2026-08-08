import prisma from '../config/db.js';

class HealthCheckRepository {
  /**
   * Insert a new health check result (Worker exclusive)
   * @param {Object} data 
   */
  static async create(data) {
    return prisma.healthCheck.create({
      data,
    });
  }

  /**
   * Find health checks for a service, validating organization ownership
   * @param {string} serviceId 
   * @param {string} organizationId 
   * @param {Object} pagination 
   * @param {number} pagination.page 
   * @param {number} pagination.limit 
   */
  static async findManyByService(serviceId, organizationId, { page = 1, limit = 50 } = {}) {
    const skip = (page - 1) * limit;

    // Verify service belongs to organization first
    const serviceExists = await prisma.service.findFirst({
      where: { id: serviceId, organizationId },
      select: { id: true },
    });

    if (!serviceExists) {
      return { healthChecks: [], total: 0 };
    }

    const [healthChecks, total] = await Promise.all([
      prisma.healthCheck.findMany({
        where: { serviceId },
        skip,
        take: limit,
        orderBy: { checkedAt: 'desc' },
      }),
      prisma.healthCheck.count({
        where: { serviceId },
      }),
    ]);

    return { healthChecks, total };
  }

  /**
   * Calculate service uptime statistics over a duration in days (Tenant isolated)
   * @param {string} serviceId 
   * @param {string} organizationId 
   * @param {number} days 
   */
  static async getUptimeStats(serviceId, organizationId, days = 30) {
    const serviceExists = await prisma.service.findFirst({
      where: { id: serviceId, organizationId },
      select: { id: true },
    });

    if (!serviceExists) {
      return { uptimePercent: 0, avgLatency: 0, failureCount: 0, totalCount: 0 };
    }

    const dateLimit = new Date();
    dateLimit.setDate(dateLimit.getDate() - days);

    const checks = await prisma.healthCheck.findMany({
      where: {
        serviceId,
        checkedAt: { gte: dateLimit },
      },
      select: {
        status: true,
        responseTimeMs: true,
      },
    });

    if (checks.length === 0) {
      return { uptimePercent: 100, avgLatency: 0, failureCount: 0, totalCount: 0 };
    }

    const totalCount = checks.length;
    const successCount = checks.filter((c) => c.status === 'up').length;
    const failureCount = totalCount - successCount;
    const totalLatency = checks.reduce((sum, c) => sum + (c.responseTimeMs || 0), 0);

    return {
      uptimePercent: parseFloat(((successCount / totalCount) * 100).toFixed(2)),
      avgLatency: parseFloat((totalLatency / totalCount).toFixed(2)),
      failureCount,
      totalCount,
    };
  }

  /**
   * High-performance cursor-based pagination for health checks
   * @param {string} serviceId 
   * @param {string} organizationId 
   * @param {Object} options 
   * @param {string} [options.cursor] ID of last record from previous page
   * @param {number} [options.limit] Number of items to fetch (default 50)
   */
  static async findManyByServiceCursor(serviceId, organizationId, { cursor, limit = 50 } = {}) {
    const serviceExists = await prisma.service.findFirst({
      where: { id: serviceId, organizationId },
      select: { id: true },
    });

    if (!serviceExists) {
      return { healthChecks: [], nextCursor: null };
    }

    const query = {
      where: { serviceId },
      take: limit + 1,
      orderBy: { checkedAt: 'desc' },
    };

    if (cursor) {
      query.cursor = { id: cursor };
      query.skip = 1;
    }

    const records = await prisma.healthCheck.findMany(query);
    let nextCursor = null;

    if (records.length > limit) {
      const nextItem = records.pop();
      nextCursor = nextItem.id;
    }

    return { healthChecks: records, nextCursor };
  }

  /**
   * Retention purge helper (Worker exclusive)
   * @param {Date} cutoffDate 
   */
  static async deleteOlderThan(cutoffDate) {
    return prisma.healthCheck.deleteMany({
      where: {
        checkedAt: { lt: cutoffDate },
      },
    });
  }
}

export default HealthCheckRepository;
