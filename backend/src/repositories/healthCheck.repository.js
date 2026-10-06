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

  /**
   * Get response time percentiles (p50, p95, p99) and uptime percentages over 24h, 7d, 30d
   * using SQL percentile_cont aggregation.
   * @param {string} serviceId
   * @param {string} organizationId
   */
  static async getServicePerformance(serviceId, organizationId) {
    const service = await prisma.service.findFirst({
      where: { id: serviceId, organizationId },
      select: { id: true, name: true, monitorType: true },
    });

    if (!service) {
      return null;
    }

    const now = new Date();
    const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const since30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const queryAgg = async (since) => {
      const rows = await prisma.$queryRaw`
        SELECT
          COUNT(*)::int AS "totalChecks",
          COUNT(*) FILTER (WHERE status = 'up')::int AS "upChecks",
          COALESCE(ROUND((COUNT(*) FILTER (WHERE status = 'up')::numeric / NULLIF(COUNT(*), 0)::numeric) * 100, 2)::float, 100) AS "uptimePercentage",
          COALESCE(ROUND(percentile_cont(0.50) WITHIN GROUP (ORDER BY "response_time_ms")::numeric, 2)::float, 0) AS "p50",
          COALESCE(ROUND(percentile_cont(0.95) WITHIN GROUP (ORDER BY "response_time_ms")::numeric, 2)::float, 0) AS "p95",
          COALESCE(ROUND(percentile_cont(0.99) WITHIN GROUP (ORDER BY "response_time_ms")::numeric, 2)::float, 0) AS "p99"
        FROM "health_checks"
        WHERE "service_id" = ${serviceId}::uuid AND "checked_at" >= ${since};
      `;
      return rows[0] || {
        totalChecks: 0,
        upChecks: 0,
        uptimePercentage: 100,
        p50: 0,
        p95: 0,
        p99: 0,
      };
    };

    const [w24h, w7d, w30d, recentPoints, latestSsl] = await Promise.all([
      queryAgg(since24h),
      queryAgg(since7d),
      queryAgg(since30d),
      prisma.healthCheck.findMany({
        where: { serviceId },
        select: {
          id: true,
          status: true,
          responseTimeMs: true,
          checkedAt: true,
        },
        orderBy: { checkedAt: 'desc' },
        take: 50,
      }),
      prisma.healthCheck.findFirst({
        where: { serviceId, sslDaysRemaining: { not: null } },
        select: { sslDaysRemaining: true, checkedAt: true },
        orderBy: { checkedAt: 'desc' },
      }),
    ]);

    const orderedPoints = [...recentPoints].reverse();

    return {
      serviceId,
      windows: {
        '24h': w24h,
        '7d': w7d,
        '30d': w30d,
      },
      timeSeries: orderedPoints,
      sparkline: orderedPoints.slice(-24).map((p) => p.responseTimeMs || 0),
      ssl: latestSsl
        ? {
            daysRemaining: latestSsl.sslDaysRemaining,
            checkedAt: latestSsl.checkedAt,
          }
        : null,
    };
  }

  /**
   * Get recent 24 data points per service for sparkline rendering
   * @param {string[]} serviceIds
   */
  static async getRecentSparklines(serviceIds) {
    if (!serviceIds || serviceIds.length === 0) return {};

    const checks = await prisma.healthCheck.findMany({
      where: { serviceId: { in: serviceIds } },
      select: {
        serviceId: true,
        status: true,
        responseTimeMs: true,
        checkedAt: true,
      },
      orderBy: { checkedAt: 'desc' },
      take: serviceIds.length * 24,
    });

    const sparklines = {};
    for (const id of serviceIds) {
      sparklines[id] = [];
    }

    for (const check of checks) {
      if (sparklines[check.serviceId] && sparklines[check.serviceId].length < 24) {
        sparklines[check.serviceId].push({
          status: check.status,
          responseTimeMs: check.responseTimeMs || 0,
          checkedAt: check.checkedAt,
        });
      }
    }

    for (const id of serviceIds) {
      sparklines[id].reverse();
    }

    return sparklines;
  }
}

export default HealthCheckRepository;
