import prisma from '../config/db.js';

class AlertRuleRepository {
  /**
   * Create an alert rule with channels
   * @param {string} organizationId
   * @param {Object} data
   */
  static async create(organizationId, data) {
    const { channelIds = [], ...rest } = data;

    return prisma.alertRule.create({
      data: {
        organizationId,
        name: rest.name,
        trigger: rest.trigger,
        conditions: rest.conditions || {},
        serviceId: rest.serviceId || null,
        projectId: rest.projectId || null,
        cooldownSeconds: rest.cooldownSeconds !== undefined ? rest.cooldownSeconds : 300,
        isActive: rest.isActive !== undefined ? rest.isActive : true,
        channels: {
          connect: channelIds.map((id) => ({ id })),
        },
      },
      include: {
        channels: true,
        service: {
          select: {
            id: true,
            name: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Find an alert rule by ID
   * @param {string} id
   * @param {string} organizationId
   */
  static async findById(id, organizationId) {
    return prisma.alertRule.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        channels: true,
        service: {
          select: {
            id: true,
            name: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        fires: {
          take: 5,
          orderBy: { firedAt: 'desc' },
        },
      },
    });
  }

  /**
   * List all alert rules for an organization
   * @param {string} organizationId
   * @param {Object} [filter]
   */
  static async findMany(organizationId, { isActive } = {}) {
    const where = { organizationId };
    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    return prisma.alertRule.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        channels: true,
        service: {
          select: {
            id: true,
            name: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        fires: {
          take: 1,
          orderBy: { firedAt: 'desc' },
        },
      },
    });
  }

  /**
   * Update an alert rule
   * @param {string} id
   * @param {string} organizationId
   * @param {Object} data
   */
  static async update(id, organizationId, data) {
    const { channelIds, ...rest } = data;

    const updateData = { ...rest };
    if (channelIds !== undefined) {
      updateData.channels = {
        set: channelIds.map((cId) => ({ id: cId })),
      };
    }

    return prisma.alertRule.update({
      where: {
        id,
        organizationId,
      },
      data: updateData,
      include: {
        channels: true,
        service: {
          select: {
            id: true,
            name: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
        fires: {
          take: 1,
          orderBy: { firedAt: 'desc' },
        },
      },
    });
  }

  /**
   * Delete an alert rule
   * @param {string} id
   * @param {string} organizationId
   */
  static async delete(id, organizationId) {
    return prisma.alertRule.delete({
      where: {
        id,
        organizationId,
      },
    });
  }

  /**
   * Snooze an alert rule
   * @param {string} id
   * @param {string} organizationId
   * @param {Date} until
   */
  static async snooze(id, organizationId, until) {
    return prisma.alertRule.update({
      where: {
        id,
        organizationId,
      },
      data: {
        snoozedUntil: until,
      },
      include: {
        channels: true,
      },
    });
  }

  /**
   * Remove snooze from an alert rule
   * @param {string} id
   * @param {string} organizationId
   */
  static async unsnooze(id, organizationId) {
    return prisma.alertRule.update({
      where: {
        id,
        organizationId,
      },
      data: {
        snoozedUntil: null,
      },
      include: {
        channels: true,
      },
    });
  }

  /**
   * Find matching active rules by organization and trigger
   * @param {string} organizationId
   * @param {string} trigger
   * @param {Object} [filter]
   * @param {string} [filter.serviceId]
   * @param {string} [filter.projectId]
   */
  static async findMatchingRules(organizationId, trigger, { serviceId, projectId } = {}) {
    const where = {
      organizationId,
      trigger,
      isActive: true,
    };

    if (serviceId !== undefined) {
      where.OR = [
        { serviceId: null },
        { serviceId },
      ];
    }

    if (projectId !== undefined) {
      where.OR = [
        { projectId: null },
        { projectId },
      ];
    }

    return prisma.alertRule.findMany({
      where,
      include: {
        channels: {
          where: { isActive: true },
        },
        fires: {
          take: 1,
          orderBy: { firedAt: 'desc' },
        },
      },
    });
  }

  /**
   * Record an alert rule firing event
   * @param {string} ruleId
   * @param {Object} context
   */
  static async recordFire(ruleId, context = {}) {
    return prisma.alertRuleFire.create({
      data: {
        ruleId,
        context,
      },
    });
  }

  /**
   * Count total rules for an organization (used to check if any rules exist)
   * @param {string} organizationId
   */
  static async countRules(organizationId) {
    return prisma.alertRule.count({
      where: { organizationId },
    });
  }
}

export default AlertRuleRepository;
