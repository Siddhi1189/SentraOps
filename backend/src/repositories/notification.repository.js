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
  /**
   * List notifications in an organization with per-user read status
   * @param {string} organizationId
   * @param {string} userId
   * @param {Object} query
   * @param {number} [query.page]
   * @param {number} [query.limit]
   * @param {string} [query.status]
   */
  static async findManyForUser(organizationId, userId, { page = 1, limit = 20, status } = {}) {
    const skip = (page - 1) * limit;
    const where = { organizationId };
    if (status) where.status = status;

    const [rawNotifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          incident: {
            select: { id: true, title: true, severity: true },
          },
          maintenance: {
            select: { id: true, title: true },
          },
          notificationReads: {
            where: { userId },
            select: { id: true, readAt: true },
          },
        },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          organizationId,
          notificationReads: {
            none: { userId },
          },
        },
      }),
    ]);

    const notifications = rawNotifications.map((n) => {
      const isRead = Array.isArray(n.notificationReads) && n.notificationReads.length > 0;
      let title = `Notification via ${n.channel}`;
      if (n.incident?.title) {
        title = `Incident: ${n.incident.title}`;
      } else if (n.maintenance?.title) {
        title = `Maintenance: ${n.maintenance.title}`;
      }

      return {
        id: n.id,
        channel: n.channel,
        recipient: n.recipient,
        status: n.status,
        sentAt: n.sentAt,
        createdAt: n.createdAt,
        title,
        incident: n.incident,
        maintenance: n.maintenance,
        isRead,
      };
    });

    return { notifications, total, unreadCount };
  }

  /**
   * Mark a single notification as read for a specific user
   * @param {string} notificationId
   * @param {string} userId
   * @param {string} organizationId
   */
  static async markAsRead(notificationId, userId, organizationId) {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, organizationId },
    });
    if (!notification) return null;

    return prisma.notificationRead.upsert({
      where: {
        notificationId_userId: { notificationId, userId },
      },
      update: {},
      create: {
        notificationId,
        userId,
      },
    });
  }

  /**
   * Mark all notifications in an organization as read for a user
   * @param {string} organizationId
   * @param {string} userId
   */
  static async markAllAsRead(organizationId, userId) {
    const unread = await prisma.notification.findMany({
      where: {
        organizationId,
        notificationReads: {
          none: { userId },
        },
      },
      select: { id: true },
    });

    if (unread.length === 0) return { count: 0 };

    return prisma.notificationRead.createMany({
      data: unread.map((n) => ({
        notificationId: n.id,
        userId,
      })),
      skipDuplicates: true,
    });
  }
}

export default NotificationRepository;
