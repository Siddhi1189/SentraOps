import prisma from '../config/db.js';

class ApiKeyRepository {
  /**
   * Create an API key
   */
  static async create(data) {
    return prisma.apiKey.create({ data });
  }

  /**
   * Find API keys for a project (excludes keyHash for security)
   */
  static async findManyByProject(projectId) {
    return prisma.apiKey.findMany({
      where: { projectId },
      select: {
        id: true,
        projectId: true,
        name: true,
        keyPrefix: true,
        lastUsedAt: true,
        revokedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Find an API key by ID and project ID
   */
  static async findByIdAndProject(id, projectId) {
    return prisma.apiKey.findFirst({
      where: { id, projectId },
      select: {
        id: true,
        projectId: true,
        name: true,
        keyPrefix: true,
        lastUsedAt: true,
        revokedAt: true,
        createdAt: true,
      },
    });
  }

  /**
   * Look up API key by SHA-256 hash (includes project and organization)
   */
  static async findByHash(keyHash) {
    return prisma.apiKey.findUnique({
      where: { keyHash },
      include: {
        project: {
          select: {
            id: true,
            organizationId: true,
            name: true,
            platform: true,
            environmentDefault: true,
          },
        },
      },
    });
  }

  /**
   * Update last used timestamp
   */
  static async updateLastUsedAt(id) {
    return prisma.apiKey.update({
      where: { id },
      data: { lastUsedAt: new Date() },
    });
  }

  /**
   * Revoke an API key
   */
  static async revoke(id) {
    return prisma.apiKey.update({
      where: { id },
      data: { revokedAt: new Date() },
      select: {
        id: true,
        projectId: true,
        name: true,
        keyPrefix: true,
        lastUsedAt: true,
        revokedAt: true,
        createdAt: true,
      },
    });
  }
}

export default ApiKeyRepository;
