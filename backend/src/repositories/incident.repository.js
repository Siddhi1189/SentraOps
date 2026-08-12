import prisma from '../config/db.js';
import AppError from '../utils/AppError.js';
import { TimelineEventTypes } from '../constants.js';

class IncidentRepository {
  /**
   * Find an incident by ID and organization ID
   * @param {string} id 
   * @param {string} organizationId 
   */
  static async findById(id, organizationId) {
    return prisma.incident.findFirst({
      where: { id, organizationId },
      include: {
        service: true,
        assignedUser: true,
        timelineEvents: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  /**
   * List incidents with filters and pagination
   * @param {string} organizationId 
   * @param {Object} query 
   * @param {number} query.page 
   * @param {number} query.limit 
   * @param {string} [query.status] 
   * @param {string} [query.severity] 
   * @param {string} [query.serviceId] 
   */
  static async findMany(organizationId, { page = 1, limit = 10, status, severity, serviceId } = {}) {
    const skip = (page - 1) * limit;

    const where = {
      organizationId,
    };

    if (status) {
      where.status = status;
    }
    if (severity) {
      where.severity = severity;
    }
    if (serviceId) {
      where.serviceId = serviceId;
    }

    const [incidents, total] = await Promise.all([
      prisma.incident.findMany({
        where,
        skip,
        take: limit,
        include: {
          service: true,
          assignedUser: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.incident.count({ where }),
    ]);

    return { incidents, total };
  }

  /**
   * Create an incident (system/worker or tenant initiated)
   * @param {string} organizationId 
   * @param {Object} data 
   */
  static async create(organizationId, data) {
    return prisma.incident.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  /**
   * Update an incident with OCC version checking
   * @param {string} id 
   * @param {string} organizationId 
   * @param {Object} data 
   * @param {string|Date} [currentUpdatedAt] Timestamp token for concurrency control
   */
  static async update(id, organizationId, data, currentUpdatedAt = null) {
    if (currentUpdatedAt) {
      const existing = await prisma.incident.findFirst({
        where: { id, organizationId },
        select: { updatedAt: true },
      });
      if (!existing) {
        throw new Error('Incident not found or inaccessible');
      }
      const dbTime = new Date(existing.updatedAt).getTime();
      const incomingTime = new Date(currentUpdatedAt).getTime();
      if (dbTime !== incomingTime) {
        throw new Error('CONCURRENCY_ERROR: Incident was modified by another process. Please reload.');
      }
    }

    // We execute updateMany to enforce tenant isolation at query engine level
    const updateResult = await prisma.incident.updateMany({
      where: { id, organizationId },
      data,
    });

    if (updateResult.count === 0) {
      throw new Error('Incident not found or not updated');
    }

    return prisma.incident.findUnique({
      where: { id },
      include: {
        service: true,
        assignedUser: true,
      },
    });
  }

  /**
   * Find incidents for analytics processing
   * @param {string} organizationId 
   * @param {Object} [filter]
   */
  static async findAnalyticsData(organizationId, { serviceId } = {}) {
    const where = { organizationId };
    if (serviceId) where.serviceId = serviceId;

    return prisma.incident.findMany({
      where,
      select: {
        severity: true,
        status: true,
        detectedAt: true,
        resolvedAt: true,
        createdAt: true,
      },
    });
  }

  /**
   * Execute multi-table incident update, append timeline events, and reset service state in a transaction
   * @param {string} incidentId 
   * @param {string} organizationId 
   * @param {Object} updateData 
   * @param {Array} timelineEntries 
   * @param {string|Date} [currentUpdatedAt] 
   */
  static async updateWithTimelineAndService(incidentId, organizationId, updateData, timelineEntries, currentUpdatedAt = null) {
    return prisma.$transaction(async (tx) => {
      // OCC check
      if (currentUpdatedAt) {
        const current = await tx.incident.findFirst({
          where: { id: incidentId, organizationId },
          select: { updatedAt: true },
        });
        if (!current) {
          throw new AppError('Incident not found', 404, 'NOT_FOUND');
        }
        if (new Date(current.updatedAt).getTime() !== new Date(currentUpdatedAt).getTime()) {
          throw new AppError('Incident was modified by someone else. Please reload.', 409, 'CONCURRENCY_ERROR');
        }
      }

      const existingIncident = await tx.incident.findFirst({
        where: { id: incidentId, organizationId },
        select: { serviceId: true },
      });

      if (!existingIncident) {
        throw new AppError('Incident not found', 404, 'NOT_FOUND');
      }

      await tx.incident.updateMany({
        where: { id: incidentId, organizationId },
        data: updateData,
      });

      for (const entry of timelineEntries) {
        await tx.timelineEvent.create({
          data: { incidentId, ...entry },
        });
      }

      if (updateData.status === 'resolved') {
        const lastCheck = await tx.healthCheck.findFirst({
          where: { serviceId: existingIncident.serviceId },
          orderBy: { checkedAt: 'desc' },
        });
        const newServiceStatus = lastCheck?.status === 'up' ? 'up' : 'unknown';
        await tx.service.update({
          where: { id: existingIncident.serviceId },
          data: { currentStatus: newServiceStatus, consecutiveFailures: 0 },
        });
      }

      return tx.incident.findUnique({
        where: { id: incidentId },
        include: { service: true, assignedUser: true },
      });
    });
  }

  /**
   * Worker transaction: Auto-resolve open incident and reset service to up
   * @param {Object} service 
   * @param {number} responseTimeMs 
   * @param {number} httpStatusCode 
   */
  static async processWorkerRecovery(service, responseTimeMs, httpStatusCode) {
    return prisma.$transaction(async (tx) => {
      const openIncident = await tx.incident.findFirst({
        where: { serviceId: service.id, status: { not: 'resolved' } },
      });

      if (openIncident) {
        await tx.incident.update({
          where: { id: openIncident.id },
          data: {
            status: 'resolved',
            resolvedAt: new Date(),
            resolutionNotes: 'Automatically resolved after health check succeeded.',
          },
        });

        await tx.timelineEvent.create({
          data: {
            incidentId: openIncident.id,
            eventType: TimelineEventTypes.RESOLVED,
            description: `Service ${service.name} automatically recovered after a successful health check. Response time: ${responseTimeMs}ms.`,
            metadata: { responseTimeMs, httpStatusCode },
          },
        });
      }

      await tx.service.update({
        where: { id: service.id },
        data: { consecutiveFailures: 0, currentStatus: 'up' },
      });

      return openIncident;
    });
  }

  /**
   * Worker transaction: Update failure count, create or escalate incident
   * @param {Object} service 
   * @param {number} newFailures 
   * @param {Object} policy 
   * @param {string} errorMessage 
   * @param {number} httpStatusCode 
   */
  static async processWorkerFailure(service, newFailures, policy, errorMessage, httpStatusCode) {
    return prisma.$transaction(async (tx) => {
      let newServiceStatus = service.currentStatus;
      if (newFailures >= policy.criticalThreshold || newFailures >= policy.incidentThreshold) {
        newServiceStatus = 'down';
      } else if (newFailures >= policy.warningThreshold) {
        newServiceStatus = 'degraded';
      }

      await tx.service.update({
        where: { id: service.id },
        data: { consecutiveFailures: newFailures, currentStatus: newServiceStatus },
      });

      let createdIncident = null;
      let escalatedIncident = null;

      if (newFailures >= policy.incidentThreshold) {
        const existingIncident = await tx.incident.findFirst({
          where: { serviceId: service.id, status: { not: 'resolved' } },
        });

        if (!existingIncident) {
          const severity = newFailures >= policy.criticalThreshold ? 'critical' : 'high';
          createdIncident = await tx.incident.create({
            data: {
              organizationId: service.organizationId,
              serviceId: service.id,
              title: `Service Outage: ${service.name} is failing health checks`,
              status: 'open',
              severity,
            },
          });

          await tx.timelineEvent.create({
            data: {
              incidentId: createdIncident.id,
              eventType: TimelineEventTypes.INCIDENT_CREATED,
              description: `Incident automatically created after ${newFailures} consecutive health check failures. Error: ${errorMessage}`,
              metadata: { consecutiveFailures: newFailures, httpStatusCode, errorMessage },
            },
          });
        } else if (newFailures >= policy.criticalThreshold && existingIncident.severity !== 'critical') {
          await tx.incident.update({
            where: { id: existingIncident.id },
            data: { severity: 'critical' },
          });

          await tx.timelineEvent.create({
            data: {
              incidentId: existingIncident.id,
              eventType: TimelineEventTypes.STATUS_CHANGED,
              description: `Incident severity escalated to CRITICAL after reaching ${newFailures} consecutive failures.`,
              metadata: { consecutiveFailures: newFailures },
            },
          });

          escalatedIncident = existingIncident;
        }
      }

      return { newServiceStatus, createdIncident, escalatedIncident };
    });
  }

  /**
   * Find an open incident for a specific service (Worker exclusive, no tenant id required)
   * @param {string} serviceId 
   */
  static async findOpenIncidentForService(serviceId) {
    return prisma.incident.findFirst({
      where: {
        serviceId,
        status: {
          not: 'resolved',
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export default IncidentRepository;
