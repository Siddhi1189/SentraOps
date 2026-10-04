import prisma from '../config/db.js';

class ErrorEventRepository {
  /**
   * Create an error event
   */
  static async create(data) {
    return prisma.errorEvent.create({ data });
  }

  /**
   * Find events for an issue with pagination
   */
  static async findByIssueId(issueId, { page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    const [events, total] = await Promise.all([
      prisma.errorEvent.findMany({
        where: { issueId },
        include: { releaseRef: true },
        orderBy: { occurredAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.errorEvent.count({ where: { issueId } }),
    ]);

    return {
      events,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Delete error events older than a cutoff date (retention policy)
   */
  static async deleteOlderThan(cutoffDate) {
    return prisma.errorEvent.deleteMany({
      where: {
        occurredAt: { lt: cutoffDate },
      },
    });
  }

  /**
   * Count distinct users for an issue from stored events
   */
  static async countDistinctUsersByIssue(issueId) {
    const events = await prisma.errorEvent.findMany({
      where: { issueId },
      select: { user: true },
    });

    const userIds = new Set();
    for (const ev of events) {
      if (ev.user && typeof ev.user === 'object' && ev.user.id) {
        userIds.add(String(ev.user.id));
      }
    }
    return userIds.size;
  }

  /**
   * Count events for a project since a specific date
   */
  static async countEventsByProjectSince(projectId, sinceDate) {
    return prisma.errorEvent.count({
      where: {
        projectId,
        occurredAt: { gte: sinceDate },
      },
    });
  }
}

export default ErrorEventRepository;
