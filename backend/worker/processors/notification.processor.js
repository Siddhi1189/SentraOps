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

  // Determine target recipient email addresses
  let recipients = [];
  if (recipient) {
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

  for (const targetEmail of recipients) {
    const notificationRecord = await NotificationRepository.create(organizationId, {
      incidentId: incidentId || null,
      maintenanceId: maintenanceId || null,
      channel: channel || NotificationChannels.EMAIL,
      recipient: targetEmail,
      status: NotificationStatuses.PENDING,
    });

    try {
      await NotificationService.dispatch(channel || NotificationChannels.EMAIL, {
        recipient: targetEmail,
        subject,
        body,
      });

      await NotificationRepository.workerUpdateStatus(
        notificationRecord.id,
        NotificationStatuses.SENT,
        new Date()
      );
      logger.info(`Notification sent successfully to ${targetEmail}`);
    } catch (err) {
      await NotificationRepository.workerUpdateStatus(
        notificationRecord.id,
        NotificationStatuses.FAILED,
        null
      );
      logger.error(`Notification attempt ${job.attemptsMade} failed for ${targetEmail}: ${err.message}`);
      
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
