import prisma from '../config/db.js';

class ServiceGroupRepository {
  /**
   * Create a new service group
   * @param {string} organizationId 
   * @param {Object} data 
   */
  static async create(organizationId, data) {
    return prisma.serviceGroup.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  /**
   * Find a service group by ID and organization ID
   * @param {string} id 
   * @param {string} organizationId 
   */
  static async findById(id, organizationId) {
    return prisma.serviceGroup.findFirst({
      where: { id, organizationId },
      include: {
        parentGroup: true,
        childGroups: true,
        services: true,
      },
    });
  }

  /**
   * List all service groups in an organization
   * @param {string} organizationId 
   */
  static async findMany(organizationId) {
    return prisma.serviceGroup.findMany({
      where: { organizationId },
      include: {
        parentGroup: true,
        childGroups: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Update a service group
   * @param {string} id 
   * @param {string} organizationId 
   * @param {Object} data 
   */
  static async update(id, organizationId, data) {
    // Note: We use updateMany here to enforce tenant isolation at the query engine level
    return prisma.serviceGroup.updateMany({
      where: { id, organizationId },
      data,
    });
  }

  /**
   * Delete a service group
   * @param {string} id 
   * @param {string} organizationId 
   */
  static async delete(id, organizationId) {
    return prisma.serviceGroup.deleteMany({
      where: { id, organizationId },
    });
  }
}

export default ServiceGroupRepository;
