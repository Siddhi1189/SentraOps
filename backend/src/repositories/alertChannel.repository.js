import prisma from '../config/db.js';

class AlertChannelRepository {
  /**
   * Create an alert channel
   * @param {string} organizationId
   * @param {Object} data
   */
  static async create(organizationId, data) {
    return prisma.alertChannel.create({
      data: {
        organizationId,
        type: data.type,
        name: data.name,
        config: data.config || {},
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });
  }

  /**
   * Find an alert channel by ID and organization ID
   * @param {string} id
   * @param {string} organizationId
   */
  static async findById(id, organizationId) {
    return prisma.alertChannel.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        rules: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Find multiple alert channels by IDs and organization ID
   * @param {string[]} ids
   * @param {string} organizationId
   */
  static async findByIds(ids, organizationId) {
    return prisma.alertChannel.findMany({
      where: {
        id: { in: ids },
        organizationId,
      },
    });
  }

  /**
   * List all alert channels for an organization
   * @param {string} organizationId
   * @param {Object} [filter]
   */
  static async findMany(organizationId, { isActive } = {}) {
    const where = { organizationId };
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return prisma.alertChannel.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        rules: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Update an alert channel
   * @param {string} id
   * @param {string} organizationId
   * @param {Object} data
   */
  static async update(id, organizationId, data) {
    return prisma.alertChannel.update({
      where: {
        id,
        organizationId,
      },
      data,
    });
  }

  /**
   * Delete an alert channel
   * @param {string} id
   * @param {string} organizationId
   */
  static async delete(id, organizationId) {
    return prisma.alertChannel.delete({
      where: {
        id,
        organizationId,
      },
    });
  }
}

export default AlertChannelRepository;
