import IncidentRepository from '../repositories/incident.repository.js';
import TimelineEventRepository from '../repositories/timelineEvent.repository.js';
import StatusPageService from './statusPageService.js';
import OrganizationRepository from '../repositories/organization.repository.js';
import AppError from '../utils/AppError.js';
import { TimelineEventTypes } from '../constants.js';
import logger from '../utils/logger.js';

// Lazy import to avoid circular deps
async function getSubscriberService() {
  const mod = await import('./statusSubscriberService.js');
  return mod.default;
}


class IncidentService {
  /**
   * List incidents for an organization with filters and pagination
   * @param {string} organizationId
   * @param {Object} query
   */
  static async listIncidents(organizationId, query = {}) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const { status, severity, serviceId } = query;

    return IncidentRepository.findMany(organizationId, { page, limit, status, severity, serviceId });
  }

  /**
   * Get a single incident by ID (tenant scoped)
   * @param {string} organizationId
   * @param {string} incidentId
   */
  static async getIncident(organizationId, incidentId) {
    const incident = await IncidentRepository.findById(incidentId, organizationId);
    if (!incident) throw new AppError('Incident not found', 404, 'NOT_FOUND');
    return incident;
  }

  /**
   * Update an incident with OCC, automatic timeline recording, and service state reset
   * @param {string} organizationId
   * @param {string} incidentId
   * @param {Object} updates
   * @param {string} actorId   User performing the update (for timeline attribution)
   * @param {string|Date} [currentUpdatedAt]  OCC token from the client
   */
  static async updateIncident(organizationId, incidentId, updates, actorId, currentUpdatedAt = null) {
    const existing = await IncidentRepository.findById(incidentId, organizationId);
    if (!existing) throw new AppError('Incident not found', 404, 'NOT_FOUND');

    const updateData = {};
    const timelineEntries = [];

    // --- Field-level processing ---
    if (updates.status && updates.status !== existing.status) {
      updateData.status = updates.status;

      if (updates.status === 'resolved') {
        updateData.resolvedAt = new Date();
        timelineEntries.push({
          eventType: TimelineEventTypes.RESOLVED,
          description: updates.resolutionNotes
            ? `Incident resolved. Notes: ${updates.resolutionNotes}`
            : 'Incident marked as resolved.',
          metadata: { by: actorId },
        });
      } else {
        timelineEntries.push({
          eventType: TimelineEventTypes.STATUS_CHANGED,
          description: `Status changed from "${existing.status}" to "${updates.status}".`,
          metadata: { by: actorId, from: existing.status, to: updates.status },
        });
      }
    }

    if (updates.severity && updates.severity !== existing.severity) {
      updateData.severity = updates.severity;
      timelineEntries.push({
        eventType: TimelineEventTypes.STATUS_CHANGED,
        description: `Severity changed from "${existing.severity}" to "${updates.severity}".`,
        metadata: { by: actorId, from: existing.severity, to: updates.severity },
      });
    }

    if (updates.assignedUserId !== undefined && updates.assignedUserId !== existing.assignedUserId) {
      updateData.assignedUserId = updates.assignedUserId;
      timelineEntries.push({
        eventType: TimelineEventTypes.ASSIGNED,
        description: updates.assignedUserId
          ? `Incident assigned to user ${updates.assignedUserId}.`
          : 'Incident unassigned.',
        metadata: { by: actorId, assignedTo: updates.assignedUserId },
      });
    }

    if (updates.title) updateData.title = updates.title;
    if (updates.resolutionNotes !== undefined) updateData.resolutionNotes = updates.resolutionNotes;

    if (Object.keys(updateData).length === 0) {
      return existing; // Nothing to update
    }

    const result = await IncidentRepository.updateWithTimelineAndService(
      incidentId,
      organizationId,
      updateData,
      timelineEntries,
      currentUpdatedAt
    );
    await StatusPageService.invalidateCache(organizationId);

    // Notify confirmed status-page subscribers on status changes
    if (updates.status && updates.status !== existing.status) {
      try {
        const org = await OrganizationRepository.findById(organizationId);
        if (org) {
          const SubscriberService = await getSubscriberService();
          const statusLabel = updates.status === 'resolved' ? 'Resolved' : updates.status.charAt(0).toUpperCase() + updates.status.slice(1);
          await SubscriberService.notifySubscribers(
            organizationId,
            org.name,
            org.slug,
            {
              subject: `[${org.name}] Incident ${statusLabel}: ${existing.title}`,
              body: `<p>Incident <strong>${existing.title}</strong> has been updated to status: <strong>${statusLabel}</strong>.</p><p>View the status page for details.</p>`,
            }
          );
        }
      } catch (e) {
        logger.error(`Failed to notify subscribers on incident update: ${e.message}`);
      }
    }

    return result;
  }

  /**
   * Get the timeline events for an incident (tenant scoped)
   * @param {string} organizationId
   * @param {string} incidentId
   */
  static async getTimeline(organizationId, incidentId) {
    const incident = await IncidentRepository.findById(incidentId, organizationId);
    if (!incident) throw new AppError('Incident not found', 404, 'NOT_FOUND');
    return TimelineEventRepository.findManyByIncident(incidentId, organizationId);
  }

  /**
   * Acknowledge an incident
   * @param {string} organizationId
   * @param {string} incidentId
   * @param {Object} user
   * @param {string|Date} [currentUpdatedAt]
   */
  static async acknowledgeIncident(organizationId, incidentId, user, currentUpdatedAt = null) {
    const existing = await IncidentRepository.findById(incidentId, organizationId);
    if (!existing) throw new AppError('Incident not found', 404, 'NOT_FOUND');

    const acknowledgedAt = new Date();
    const updateData = {
      acknowledgedAt,
      acknowledgedByUserId: user.id,
    };

    const timelineEntries = [
      {
        eventType: TimelineEventTypes.STATUS_CHANGED,
        description: `Incident acknowledged by ${user.name || user.email}`,
        metadata: {
          acknowledgedBy: user.id,
          acknowledgedByName: user.name,
          acknowledgedAt,
        },
      },
    ];

    return IncidentRepository.updateWithTimelineAndService(
      incidentId,
      organizationId,
      updateData,
      timelineEntries,
      currentUpdatedAt
    );
  }

  /**
   * Add a comment / note to an incident timeline
   * @param {string} organizationId
   * @param {string} incidentId
   * @param {string} comment
   * @param {Object} user
   */
  static async addComment(organizationId, incidentId, comment, user) {
    const existing = await IncidentRepository.findById(incidentId, organizationId);
    if (!existing) throw new AppError('Incident not found', 404, 'NOT_FOUND');

    return TimelineEventRepository.create({
      incidentId,
      eventType: TimelineEventTypes.COMMENT_ADDED,
      description: comment,
      metadata: {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
      },
    });
  }
}

export default IncidentService;
