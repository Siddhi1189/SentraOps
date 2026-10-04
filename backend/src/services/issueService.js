import IssueRepository from '../repositories/issue.repository.js';
import ErrorEventRepository from '../repositories/errorEvent.repository.js';
import ServiceRepository from '../repositories/service.repository.js';
import IncidentRepository from '../repositories/incident.repository.js';
import TimelineEventRepository from '../repositories/timelineEvent.repository.js';
import AuditService from './auditService.js';
import AppError from '../utils/appError.js';
import { TimelineEventTypes } from '../constants.js';

class IssueService {
  /**
   * List issues with filtering and pagination
   */
  static async listIssues(organizationId, query = {}) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;

    return IssueRepository.findManyByOrg(organizationId, {
      projectId: query.projectId || undefined,
      status: query.status || undefined,
      environment: query.environment || undefined,
      level: query.level || undefined,
      search: query.search || undefined,
      sortBy: query.sortBy || 'lastSeen',
      sortOrder: query.sortOrder || 'desc',
      page,
      limit,
    });
  }

  /**
   * Get single issue by ID
   */
  static async getIssue(organizationId, id) {
    const issue = await IssueRepository.findByIdAndOrg(id, organizationId);
    if (!issue) {
      throw new AppError('Issue not found', 404, 'ISSUE_NOT_FOUND');
    }
    return issue;
  }

  /**
   * Get paginated error events for an issue
   */
  static async getIssueEvents(organizationId, id, query = {}) {
    const issue = await IssueRepository.findByIdAndOrg(id, organizationId);
    if (!issue) {
      throw new AppError('Issue not found', 404, 'ISSUE_NOT_FOUND');
    }

    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;

    return ErrorEventRepository.findByIssueId(id, { page, limit });
  }

  /**
   * Update issue status or assignee (with OCC check)
   */
  static async updateIssue(organizationId, userId, id, updates = {}, currentUpdatedAt = null) {
    const existing = await IssueRepository.findByIdAndOrg(id, organizationId);
    if (!existing) {
      throw new AppError('Issue not found', 404, 'ISSUE_NOT_FOUND');
    }

    // Optimistic Concurrency Control (OCC)
    if (currentUpdatedAt) {
      const dbTime = new Date(existing.updatedAt).getTime();
      const incomingTime = new Date(currentUpdatedAt).getTime();
      if (dbTime !== incomingTime) {
        throw new AppError('Issue was modified by another process. Please reload.', 409, 'CONCURRENCY_ERROR');
      }
    }

    const updateData = {};
    if (updates.status && updates.status !== existing.status) {
      updateData.status = updates.status;
      if (updates.status === 'resolved') {
        updateData.resolvedAt = new Date();
      } else {
        updateData.resolvedAt = null;
      }
    }

    if (updates.assignedUserId !== undefined) {
      updateData.assignedUserId = updates.assignedUserId || null;
    }

    if (Object.keys(updateData).length === 0) {
      return existing;
    }

    const updated = await IssueRepository.update(id, organizationId, updateData);

    await AuditService.record(organizationId, userId, 'issue.updated', 'issue', id, {
      status: updated.status,
      assignedUserId: updated.assignedUserId,
    });

    return updated;
  }

  /**
   * Create an Incident linked to an Issue
   */
  static async createIncidentFromIssue(organizationId, userId, issueId, { serviceId, title, severity = 'medium' }) {
    const issue = await IssueRepository.findByIdAndOrg(issueId, organizationId);
    if (!issue) {
      throw new AppError('Issue not found', 404, 'ISSUE_NOT_FOUND');
    }

    // Service ID is required and must belong to caller's organization
    const service = await ServiceRepository.findById(serviceId, organizationId);
    if (!service) {
      throw new AppError('Service not found in organization', 404, 'SERVICE_NOT_FOUND');
    }

    // 1. Create Incident
    const incidentTitle = title || `Incident from Issue: ${issue.title}`;
    const incident = await IncidentRepository.create({
      organizationId,
      serviceId,
      assignedUserId: userId,
      title: incidentTitle,
      severity,
      status: 'open',
    });

    // 2. Add Timeline Event
    await TimelineEventRepository.create({
      incidentId: incident.id,
      eventType: TimelineEventTypes.INCIDENT_CREATED,
      description: `Incident created from Issue ${issue.id}: "${issue.title}".`,
      metadata: { issueId, createdBy: userId },
    });

    // 3. Link Incident to Issue
    const updatedIssue = await IssueRepository.linkIncident(issueId, organizationId, incident.id);

    // 4. Audit Log
    await AuditService.record(organizationId, userId, 'incident.created_from_issue', 'incident', incident.id, {
      issueId,
      serviceId,
    });

    return {
      incident,
      issue: updatedIssue,
    };
  }
}

export default IssueService;
