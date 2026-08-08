import prisma from '../config/db.js';

class UserRepository {
  /**
   * Find a user by email (used for auth login)
   * @param {string} email 
   */
  static async findByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
      include: { organization: true },
    });
  }

  /**
   * Find user by ID and organization ID
   * @param {string} id 
   * @param {string} organizationId 
   */
  static async findById(id, organizationId) {
    return prisma.user.findFirst({
      where: { id, organizationId },
    });
  }

  /**
   * Create a new user under a specific organization
   * @param {string} organizationId 
   * @param {Object} data 
   */
  static async create(organizationId, data) {
    return prisma.user.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  /**
   * Update a user details
   * @param {string} id 
   * @param {string} organizationId 
   * @param {Object} data 
   */
  static async update(id, organizationId, data) {
    return prisma.user.updateMany({
      where: { id, organizationId },
      data,
    });
  }

  /**
   * Delete a user from an organization
   * @param {string} id 
   * @param {string} organizationId 
   */
  static async delete(id, organizationId) {
    return prisma.user.deleteMany({
      where: { id, organizationId },
    });
  }

  /**
   * List all users in an organization with pagination
   * @param {string} organizationId 
   * @param {Object} pagination
   * @param {number} pagination.page
   * @param {number} pagination.limit
   */
  static async findMany(organizationId, { page = 1, limit = 10 } = {}) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: { organizationId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({
        where: { organizationId },
      }),
    ]);
    return { users, total };
  }
}

export default UserRepository;
