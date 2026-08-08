import prisma from '../config/db.js';

class EscalationPolicyRepository {
  /**
   * Find policy by ID and organization ID
   * @param {string} id 
   * @param {string} organizationId 
   */
  static async findById(id, organizationId) {
    return prisma.escalationPolicy.findFirst({
      where: { id, organizationId },
    });
  }

  /**
   * Find all escalation policies in an organization
   * @param {string} organizationId 
   */
  static async findMany(organizationId) {
    return prisma.escalationPolicy.findMany({
      where: { organizationId },
      include: { service: true },
      orderBy: { serviceId: 'asc' }, // Defaults first (nulls are sorted first or last depending on db, but we can filter)
    });
  }

  /**
   * Find organization default policy (serviceId is null)
   * @param {string} organizationId 
   */
  static async findOrgDefault(organizationId) {
    return prisma.escalationPolicy.findFirst({
      where: { organizationId, serviceId: null },
    });
  }

  /**
   * Find specific service override policy
   * @param {string} serviceId 
   * @param {string} organizationId 
   */
  static async findByService(serviceId, organizationId) {
    return prisma.escalationPolicy.findFirst({
      where: { organizationId, serviceId },
    });
  }

  /**
   * Create or update escalation policy
   * @param {string} organizationId 
   * @param {Object} data 
   */
  static async upsert(organizationId, data) {
    const { serviceId, warningThreshold, incidentThreshold, criticalThreshold } = data;

    // Standard upsert logic scoped by organizationId and serviceId
    const existing = await prisma.escalationPolicy.findFirst({
      where: { organizationId, serviceId },
    });

    if (existing) {
      return prisma.escalationPolicy.update({
        where: { id: existing.id },
        data: {
          warningThreshold,
          incidentThreshold,
          criticalThreshold,
        },
      });
    } else {
      return prisma.escalationPolicy.create({
        data: {
          organizationId,
          serviceId,
          warningThreshold,
          incidentThreshold,
          criticalThreshold,
        },
      });
    }
  }

  /**
   * Delete an escalation policy override
   * @param {string} id 
   * @param {string} organizationId 
   */
  static async delete(id, organizationId) {
    return prisma.escalationPolicy.deleteMany({
      where: { id, organizationId },
    });
  }

  /**
   * Resolve effective escalation thresholds for a service (Worker helper)
   * Finds service-specific policy, otherwise falls back to organization-wide default.
   * @param {string} serviceId 
   * @param {string} organizationId 
   */
  static async findEffectivePolicy(serviceId, organizationId) {
    // 1. Try to find service override
    const override = await prisma.escalationPolicy.findUnique({
      where: {
        organizationId_serviceId: {
          organizationId,
          serviceId,
        },
      },
    });

    if (override) {
      return override;
    }

    // 2. Fallback to org default (serviceId = null)
    const orgDefault = await prisma.escalationPolicy.findFirst({
      where: {
        organizationId,
        serviceId: null,
      },
    });

    // 3. Fallback to hardcoded database defaults if none exists
    if (!orgDefault) {
      return {
        warningThreshold: 3,
        incidentThreshold: 5,
        criticalThreshold: 10,
      };
    }

    return orgDefault;
  }
}

export default EscalationPolicyRepository;
