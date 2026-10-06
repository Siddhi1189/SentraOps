import prisma from '../config/db.js';

class ProjectRepository {
  /**
   * Create a new project within an organization
   */
  static async create(data) {
    return prisma.project.create({ data });
  }

  /**
   * Count projects in an organization
   */
  static async countByOrg(organizationId) {
    return prisma.project.count({
      where: { organizationId },
    });
  }

  /**
   * Find all projects for an organization
   */
  static async findManyByOrg(organizationId) {
    return prisma.project.findMany({
      where: { organizationId },
      include: {
        _count: {
          select: {
            apiKeys: true,
            issues: true,
            errorEvents: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find a project by ID and organization ID
   */
  static async findByIdAndOrg(id, organizationId) {
    return prisma.project.findFirst({
      where: { id, organizationId },
      include: {
        _count: {
          select: {
            apiKeys: true,
            issues: true,
            errorEvents: true,
          },
        },
      },
    });
  }

  /**
   * Find project by ID
   */
  static async findById(id) {
    return prisma.project.findUnique({
      where: { id },
    });
  }

  /**
   * Update a project
   */
  static async update(id, organizationId, data) {
    return prisma.project.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a project (cascades related keys, issues, events)
   */
  static async delete(id) {
    return prisma.project.delete({
      where: { id },
    });
  }
}

export default ProjectRepository;
