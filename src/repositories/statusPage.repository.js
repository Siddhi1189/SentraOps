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
}

export default StatusPageRepository;
