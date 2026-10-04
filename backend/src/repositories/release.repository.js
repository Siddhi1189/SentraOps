import prisma from '../config/db.js';

class ReleaseRepository {
  /**
   * Upsert a release for a project
   * @param {Object} data
   * @param {string} data.projectId
   * @param {string} data.version
   * @param {string} [data.commitSha]
   * @param {Date} [data.deployedAt]
   * @param {string} [data.environment]
   */
  static async upsert({ projectId, version, commitSha, deployedAt, environment = 'production' }) {
    const deployedDate = deployedAt ? new Date(deployedAt) : new Date();
    return prisma.release.upsert({
      where: {
        projectId_version_environment: {
          projectId,
          version,
          environment,
        },
      },
      update: {
        commitSha: commitSha !== undefined ? commitSha : undefined,
        deployedAt: deployedDate,
      },
      create: {
        projectId,
        version,
        commitSha: commitSha || null,
        deployedAt: deployedDate,
        environment,
      },
    });
  }

  /**
   * Find releases for a project with optional pagination and environment filtering
   * @param {string} projectId
   * @param {Object} [options]
   */
  static async findByProjectId(projectId, { environment, page = 1, limit = 50 } = {}) {
    const where = { projectId };
    if (environment) where.environment = environment;

    const skip = (page - 1) * limit;

    const [releases, total] = await Promise.all([
      prisma.release.findMany({
        where,
        orderBy: { deployedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.release.count({ where }),
    ]);

    return { releases, total, page, limit };
  }

  /**
   * Find specific release
   * @param {string} projectId
   * @param {string} version
   * @param {string} environment
   */
  static async findByProjectAndVersion(projectId, version, environment = 'production') {
    return prisma.release.findUnique({
      where: {
        projectId_version_environment: {
          projectId,
          version,
          environment,
        },
      },
    });
  }
}

export default ReleaseRepository;
