import prisma from '../config/db.js';

class TagRepository {
  /**
   * Find tags in an organization
   * @param {string} organizationId 
   */
  static async findMany(organizationId) {
    return prisma.tag.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Delete a tag
   * @param {string} id 
   * @param {string} organizationId 
   */
  static async delete(id, organizationId) {
    return prisma.tag.deleteMany({
      where: { id, organizationId },
    });
  }
}

export default TagRepository;
