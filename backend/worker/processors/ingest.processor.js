import { computeFingerprint } from '../../src/utils/fingerprint.js';
import IssueRepository from '../../src/repositories/issue.repository.js';
import ErrorEventRepository from '../../src/repositories/errorEvent.repository.js';
import logger from '../../src/utils/logger.js';

/**
 * Process a BullMQ ingest job
 * @param {Object} job BullMQ Job with { eventId, projectId, organizationId, event }
 * @param {Function} [publishEvent] Optional broadcast helper
 */
export async function processIngestJob(job, publishEvent) {
  const { eventId, projectId, organizationId, event } = job.data;

  try {
    // 1. Compute fingerprint
    const fingerprint = computeFingerprint(event.type, event.stack);

    // 2. Build title from type and message
    const title = `${event.type || 'Error'}${event.message ? `: ${event.message}` : ''}`.substring(0, 255);

    const occurredAt = event.occurredAt ? new Date(event.occurredAt) : new Date();
    const userId = event.user?.id ? String(event.user.id) : null;

    // 3. Atomically upsert the issue
    const { issue, isNew, isRegression, isIgnored } = await IssueRepository.upsertFromEvent({
      projectId,
      organizationId,
      fingerprint,
      title,
      type: event.type || 'Error',
      level: event.level || 'error',
      environment: event.environment || 'production',
      occurredAt,
      userId,
    });

    // 4. Persist the ErrorEvent
    const errorEvent = await ErrorEventRepository.create({
      id: eventId,
      projectId,
      issueId: issue.id,
      type: event.type || 'Error',
      message: event.message || '',
      stack: event.stack || null,
      environment: event.environment || 'production',
      release: event.release || null,
      level: event.level || 'error',
      tags: event.tags || {},
      breadcrumbs: event.breadcrumbs || [],
      user: event.user || null,
      request: event.request || null,
      occurredAt,
    });

    // 5. Update userCount if user context is provided
    if (userId) {
      const distinctUsers = await ErrorEventRepository.countDistinctUsersByIssue(issue.id);
      await IssueRepository.updateUserCount(issue.id, distinctUsers);
    }

    // 6. Broadcast real-time events via Redis pub/sub if applicable
    if (!isIgnored && typeof publishEvent === 'function') {
      if (isRegression) {
        publishEvent(organizationId, 'issue-regression', {
          issueId: issue.id,
          projectId,
          title: issue.title,
          environment: issue.environment,
        });
      } else if (isNew) {
        publishEvent(organizationId, 'issue-created', {
          issueId: issue.id,
          projectId,
          title: issue.title,
          environment: issue.environment,
        });
      }
    }

    logger.info(`Processed error event ${eventId} for issue ${issue.id} (new: ${isNew}, regression: ${isRegression})`);
    return { eventId, issueId: issue.id };
  } catch (err) {
    logger.error(`Error processing ingest job: ${err.message}`, { stack: err.stack });
    throw err;
  }
}

export default {
  processIngestJob,
};
