import NotificationRepository from '../../src/repositories/notification.repository.js';
import UserRepository from '../../src/repositories/user.repository.js';
import NotificationService from '../../src/services/notifications/notificationService.js';
import logger from '../../src/utils/logger.js';
import { NotificationChannels, NotificationStatuses } from '../../src/constants.js';

/**
 * Process a notification job with automatic BullMQ exponential backoff retry support
 * @param {Object} job BullMQ Job object containing notification payload
 */
async function processNotificationJob(job) {
  const { organizationId, incidentId, maintenanceId, channel, recipient, subject, body } = job.data;

  // Determine target recipients
  let recipients = [];
  if (Array.isArray(recipient)) {
    recipients = recipient.filter(Boolean);
  } else if (typeof recipient === 'string' && recipient.includes(',')) {
    recipients = recipient.split(',').map((s) => s.trim()).filter(Boolean);
  } else if (recipient) {
    recipients = [recipient];
  } else {
    // If no explicit recipient is specified, broadcast to organization admins/owners
    const { users } = await UserRepository.findMany(organizationId, { limit: 50 });
    recipients = users
      .filter((u) => u.role === 'owner' || u.role === 'admin')
      .map((u) => u.email);
  }

  if (recipients.length === 0) {
    logger.warn(`No recipients found for notification job ${job.id} in org ${organizationId}`);
    return;
  }

  for (const targetRecipient of recipients) {
    // Safe recipient representation for DB record (max 255 chars)
    const dbRecipient = targetRecipient.length > 255 ? targetRecipient.substring(0, 255) : targetRecipient;
    const notificationRecord = await NotificationRepository.create(organizationId, {
      incidentId: incidentId || null,
      maintenanceId: maintenanceId || null,
      channel: channel || NotificationChannels.EMAIL,
      recipient: dbRecipient,
      status: NotificationStatuses.PENDING,
    });

    // Safely display target in logs without revealing full secret webhook tokens
    const logTarget = targetRecipient.startsWith('http')
      ? targetRecipient.replace(/\/[^/]+$/, '/...****')
      : targetRecipient;

    try {
      await NotificationService.dispatch(channel || NotificationChannels.EMAIL, {
        recipient: targetRecipient,
        subject,
        body,
      });

      await NotificationRepository.workerUpdateStatus(
        notificationRecord.id,
        NotificationStatuses.SENT,
        new Date()
      );
      logger.info(`Notification sent successfully to ${logTarget}`);
    } catch (err) {
      await NotificationRepository.workerUpdateStatus(
        notificationRecord.id,
        NotificationStatuses.FAILED,
        null
      );
      logger.error(`Notification attempt ${job.attemptsMade} failed for ${logTarget}: ${err.message}`);
      
      const maxAttempts = job.opts?.attempts || 3;
      if (job.attemptsMade < maxAttempts) {
        // Rethrow error so BullMQ performs configured exponential backoff retry
        throw err;
      }
    }
  }
}

export { processNotificationJob };
export default { processNotificationJob };
