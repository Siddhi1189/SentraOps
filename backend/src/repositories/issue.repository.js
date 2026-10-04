import prisma from '../config/db.js';

class IssueRepository {
  /**
   * Upsert issue atomically when processing an error event
   */
  static async upsertFromEvent({
    projectId,
    organizationId,
    fingerprint,
    title,
    type,
    level = 'error',
    environment = 'production',
    occurredAt = new Date(),
    userId = null,
  }) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.issue.findUnique({
        where: {
          projectId_fingerprint_environment: {
            projectId,
            fingerprint,
            environment,
          },
        },
      });

      if (!existing) {
        const newIssue = await tx.issue.create({
          data: {
            projectId,
            organizationId,
            fingerprint,
            title,
            type,
            level,
            status: 'unresolved',
            environment,
            firstSeenAt: occurredAt,
            lastSeenAt: occurredAt,
            eventCount: 1,
            userCount: userId ? 1 : 0,
            isRegression: false,
          },
        });
        return { issue: newIssue, isNew: true, isRegression: false, isIgnored: false };
      }

      const isIgnored = existing.status === 'ignored';
      const isRegression = existing.status === 'resolved';

      const updateData = {
        lastSeenAt: occurredAt,
        eventCount: { increment: 1 },
      };

      if (isRegression) {
        updateData.status = 'unresolved';
        updateData.isRegression = true;
        updateData.resolvedAt = null;
      }

      const updated = await tx.issue.update({
        where: { id: existing.id },
        data: updateData,
      });

      return {
        issue: updated,
        isNew: false,
        isRegression,
        isIgnored,
      };
    });
  }

  /**
   * Update distinct user count on an issue
   */
  static async updateUserCount(issueId, userCount) {
    return prisma.issue.update({
      where: { id: issueId },
      data: { userCount },
    });
  }

  /**
   * Find paginated issues for an organization with filtering and sorting
   */
  static async findManyByOrg(organizationId, {
    projectId,
    status,
    environment,
    level,
    search,
    sortBy = 'lastSeen',
    sortOrder = 'desc',
    page = 1,
    limit = 20,
  } = {}) {
    const where = { organizationId };

    if (projectId) where.projectId = projectId;
    if (status) where.status = status;
    if (environment) where.environment = environment;
    if (level) where.level = level;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { type: { contains: search, mode: 'insensitive' } },
      ];
    }

    const orderBy = [];
    if (sortBy === 'eventCount') {
      orderBy.push({ eventCount: sortOrder });
    } else {
      orderBy.push({ lastSeenAt: sortOrder });
    }

    const skip = (page - 1) * limit;

    const [issues, total] = await Promise.all([
      prisma.issue.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          project: {
            select: { id: true, name: true, platform: true },
          },
          assignedUser: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      prisma.issue.count({ where }),
    ]);

    return {
      issues,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Find issue by ID and organization ID
   */
  static async findByIdAndOrg(id, organizationId) {
    return prisma.issue.findFirst({
      where: { id, organizationId },
      include: {
        project: {
          select: { id: true, name: true, platform: true },
        },
        assignedUser: {
          select: { id: true, name: true, email: true },
        },
        linkedIncident: {
          select: { id: true, title: true, status: true, severity: true },
        },
        errorEvents: {
          orderBy: { occurredAt: 'desc' },
          take: 1,
        },
      },
    });
  }

  /**
   * Update issue status or assignee (with OCC check on updatedAt)
   */
  static async update(id, organizationId, data, expectedUpdatedAt = null) {
    const where = { id, organizationId };
    if (expectedUpdatedAt) {
      where.updatedAt = new Date(expectedUpdatedAt);
    }

    return prisma.issue.update({
      where,
      data,
      include: {
        project: {
          select: { id: true, name: true, platform: true },
        },
        assignedUser: {
          select: { id: true, name: true, email: true },
        },
        linkedIncident: {
          select: { id: true, title: true, status: true, severity: true },
        },
      },
    });
  }

  /**
   * Link an incident to an issue
   */
  static async linkIncident(id, organizationId, incidentId) {
    return prisma.issue.update({
      where: { id },
      data: { linkedIncidentId: incidentId },
      include: {
        linkedIncident: {
          select: { id: true, title: true, status: true, severity: true },
        },
      },
    });
  }
}

export default IssueRepository;
