import prisma from '../config/db.js';

class AuditLogRepository {
  /**
   * Create an audit log entry
   * @param {Object} data
   * @param {string} data.organizationId
   * @param {string} [data.userId]
   * @param {string} data.action
   * @param {string} data.entityType
   * @param {string} [data.entityId]
   * @param {Object} [data.metadata]
   */
  static async create(data) {
    return prisma.auditLog.create({ data });
  }

  /**
   * List audit logs for an organization with pagination
   * @param {string} organizationId
   * @param {Object} query
   * @param {number} query.page
   * @param {number} query.limit
   * @param {string} [query.entityType]
   * @param {string} [query.userId]
   */
  static async findMany(organizationId, { page = 1, limit = 20, entityType, userId } = {}) {
    const skip = (page - 1) * limit;

    const where = { organizationId };
    if (entityType) where.entityType = entityType;
    if (userId) where.userId = userId;

    const [auditLogs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { auditLogs, total };
  }

  /**
   * Retention purge helper (Worker exclusive)
   * @param {Date} cutoffDate 
   */
  static async deleteOlderThan(cutoffDate) {
    return prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });
  }
}

export default AuditLogRepository;
