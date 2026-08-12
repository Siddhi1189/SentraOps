import prisma from '../config/db.js';

class OrganizationRepository {
  /**
   * Create a new organization
   * @param {Object} data 
   */
  static async create(data) {
    return prisma.organization.create({ data });
  }

  /**
   * Find an organization by ID
   * @param {string} id 
   */
  static async findById(id) {
    return prisma.organization.findUnique({
      where: { id },
    });
  }

  /**
   * Find an organization by slug
   * @param {string} slug 
   */
  static async findBySlug(slug) {
    return prisma.organization.findUnique({
      where: { slug },
    });
  }

  /**
   * Update organization details
   * @param {string} id 
   * @param {Object} data 
   */
  static async update(id, data) {
    return prisma.organization.update({
      where: { id },
      data,
    });
  }
}

export default OrganizationRepository;
