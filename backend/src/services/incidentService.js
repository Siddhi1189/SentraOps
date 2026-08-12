import IncidentRepository from '../repositories/incident.repository.js';
import TimelineEventRepository from '../repositories/timelineEvent.repository.js';
import StatusPageService from './statusPageService.js';
import AppError from '../utils/AppError.js';
import { TimelineEventTypes } from '../constants.js';

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
}

export default IncidentService;
