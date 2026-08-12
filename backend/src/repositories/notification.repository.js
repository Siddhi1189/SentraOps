import prisma from '../config/db.js';

class NotificationRepository {
  /**
   * Find notification by ID
   * @param {string} id 
   * @param {string} organizationId 
   */
  static async findById(id, organizationId) {
    return prisma.notification.findFirst({
      where: { id, organizationId },
      include: {
        incident: true,
        maintenance: true,
      },
    });
  }

  /**
   * List notifications in an organization
   * @param {string} organizationId 
   * @param {Object} query 
   * @param {number} query.page 
   * @param {number} query.limit 
   */
  static async findMany(organizationId, { page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where: { organizationId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.notification.count({
        where: { organizationId },
      }),
    ]);

    return { notifications, total };
  }

  /**
   * Log a new notification trigger (idempotent helper can be run at service layer)
   * @param {string} organizationId 
   * @param {Object} data 
   */
  static async create(organizationId, data) {
    return prisma.notification.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  /**
   * Update notification delivery status (Worker exclusive)
   * @param {string} id 
   * @param {string} status 
   * @param {Date} [sentAt] 
   */
  static async workerUpdateStatus(id, status, sentAt = null) {
    return prisma.notification.update({
      where: { id },
      data: {
        status,
        sentAt,
      },
    });
  }
}

export default NotificationRepository;
