import prisma from '../config/db.js';

class StatusPageRepository {
  /**
   * Find status page settings by organization slug
   * @param {string} slug
   */
  static async findBySlug(slug) {
    return prisma.statusPageSettings.findFirst({
      where: { subdomain: slug },
      include: { organization: true },
    });
  }

  /**
   * Find status page settings by organization ID
   * @param {string} organizationId
   */
  static async findByOrganization(organizationId) {
    return prisma.statusPageSettings.findUnique({
      where: { organizationId },
    });
  }

  /**
   * Create status page settings for an organization
   * @param {string} organizationId
   * @param {Object} data
   */
  static async create(organizationId, data) {
    return prisma.statusPageSettings.create({
      data: { ...data, organizationId },
    });
  }

  /**
   * Update status page settings
   * @param {string} organizationId
   * @param {Object} data
   */
  static async update(organizationId, data) {
    return prisma.statusPageSettings.update({
      where: { organizationId },
      data,
    });
  }

  /**
   * Upsert status page settings
   * @param {string} organizationId
   * @param {Object} updateData
   * @param {Object} createData
   */
  static async upsert(organizationId, updateData, createData) {
    return prisma.statusPageSettings.upsert({
      where: { organizationId },
      update: updateData,
      create: {
        ...createData,
        organizationId,
      },
    });
  }

  /**
   * Get all active services for a public status page
   * @param {string} organizationId
   */
  static async findServicesForStatusPage(organizationId) {
    return prisma.service.findMany({
      where: { organizationId, isActive: true },
      select: {
        id: true,
        name: true,
        currentStatus: true,
        environment: true,
        group: { select: { id: true, name: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get open/active incidents for status page (public)
   * @param {string} organizationId
   */
  static async findOpenIncidentsForStatusPage(organizationId) {
    return prisma.incident.findMany({
      where: {
        organizationId,
        status: { not: 'resolved' },
      },
      select: {
        id: true,
        title: true,
        status: true,
        severity: true,
        detectedAt: true,
        service: { select: { id: true, name: true } },
      },
      orderBy: { detectedAt: 'desc' },
      take: 20,
    });
  }

  /**
   * Get recent resolved incidents for status page (last 7 days)
   * @param {string} organizationId
   */
  static async findRecentIncidentsForStatusPage(organizationId) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return prisma.incident.findMany({
      where: {
        organizationId,
        createdAt: { gte: sevenDaysAgo },
      },
      select: {
        id: true,
        title: true,
        status: true,
        severity: true,
        detectedAt: true,
        resolvedAt: true,
        service: { select: { id: true, name: true } },
      },
      orderBy: { detectedAt: 'desc' },
      take: 50,
    });
  }

  /**
   * Get upcoming/active maintenance windows for status page (public)
   * @param {string} organizationId
   */
  static async findMaintenanceForStatusPage(organizationId) {
    const now = new Date();
    return prisma.maintenanceWindow.findMany({
      where: {
        organizationId,
        endTime: { gte: now },
        status: { in: ['scheduled', 'in_progress'] },
      },
      select: {
        id: true,
        title: true,
        description: true,
        startTime: true,
        endTime: true,
        status: true,
        service: { select: { id: true, name: true } },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  /**
   * Get 90-day daily uptime history per service for public status page
   * @param {string} organizationId
   */
  static async get90DayUptimeForStatusPage(organizationId) {
    const services = await this.findServicesForStatusPage(organizationId);
    if (!services || services.length === 0) return { services: [] };

    const serviceIds = services.map((s) => s.id);
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    const placeholders = serviceIds.map((_, i) => `$${i + 2}`).join(', ');
    const query = `
      SELECT
        "service_id" AS "serviceId",
        DATE_TRUNC('day', "checked_at" AT TIME ZONE 'UTC') AS "day",
        COUNT(*)::int AS "totalChecks",
        COUNT(*) FILTER (WHERE status = 'up')::int AS "upChecks",
        COALESCE(ROUND((COUNT(*) FILTER (WHERE status = 'up')::numeric / NULLIF(COUNT(*), 0)::numeric) * 100, 2)::float, 100) AS "uptimePercentage"
      FROM "health_checks"
      WHERE "checked_at" >= $1 AND "service_id" IN (${placeholders})
      GROUP BY "service_id", DATE_TRUNC('day', "checked_at" AT TIME ZONE 'UTC')
      ORDER BY "day" ASC;
    `;

    const dailyChecks = await prisma.$queryRawUnsafe(query, ninetyDaysAgo, ...serviceIds).catch(() => []);

    const checkMap = {};
    for (const row of dailyChecks) {
      const key = `${row.serviceId}:${new Date(row.day).toISOString().slice(0, 10)}`;
      checkMap[key] = row;
    }

    const dates = [];
    for (let i = 89; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      dates.push(d.toISOString().slice(0, 10));
    }

    const servicesWithUptime = services.map((service) => {
      const history = dates.map((dateStr) => {
        const found = checkMap[`${service.id}:${dateStr}`];
        if (!found || found.totalChecks === 0) {
          return {
            date: dateStr,
            totalChecks: 0,
            uptimePercentage: 100,
            status: 'up',
          };
        }
        const pct = found.uptimePercentage;
        const status = pct >= 99 ? 'up' : pct >= 80 ? 'degraded' : 'down';
        return {
          date: dateStr,
          totalChecks: found.totalChecks,
          uptimePercentage: pct,
          status,
        };
      });

      const totalChecks = history.reduce((sum, h) => sum + h.totalChecks, 0);
      const upChecks = dailyChecks
        .filter((r) => r.serviceId === service.id)
        .reduce((sum, r) => sum + (r.upChecks || 0), 0);
      const overallUptime =
        totalChecks > 0 ? parseFloat(((upChecks / totalChecks) * 100).toFixed(2)) : 100;

      return {
        ...service,
        overallUptime,
        history,
      };
    });

    return { services: servicesWithUptime };
  }
}

export default StatusPageRepository;
