import StatusSubscriberRepository from '../repositories/statusSubscriber.repository.js';
import OrganizationRepository from '../repositories/organization.repository.js';
import { enqueueNotification } from '../config/queue.js';
import AppError from '../utils/AppError.js';
import logger from '../utils/logger.js';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

class StatusSubscriberService {
  /**
   * Begin double opt-in: record subscriber & enqueue confirmation email.
   */
  static async subscribe(orgSlug, email) {
    const org = await OrganizationRepository.findBySlug(orgSlug);
    if (!org) throw new AppError('Organization not found', 404, 'NOT_FOUND');

    const { subscriber } = await StatusSubscriberRepository.subscribe(org.id, email);

    const confirmUrl = `${FRONTEND_URL}/status/confirm/${subscriber.confirmToken}`;
    await enqueueNotification({
      organizationId: org.id,
      channel: 'email',
      recipient: email,
      subject: `Confirm your subscription to ${org.name} status updates`,
      body: `
        <p>Hi,</p>
        <p>You requested to subscribe to status updates for <strong>${org.name}</strong>.</p>
        <p><a href="${confirmUrl}">Click here to confirm your subscription</a></p>
        <p>This link expires in 24 hours. If you didn't request this, you can ignore this email.</p>
      `,
    });


    logger.info(`Subscription confirmation queued for ${email} on org ${orgSlug}`);
    return { message: 'Confirmation email sent. Please check your inbox.' };
  }

  /**
   * Confirm subscription via token.
   */
  static async confirm(confirmToken) {
    const subscriber = await StatusSubscriberRepository.confirm(confirmToken);
    if (!subscriber) throw new AppError('Invalid or expired confirmation token', 400, 'INVALID_TOKEN');
    return { message: 'Subscription confirmed. You will now receive status updates.' };
  }

  /**
   * Unsubscribe via token.
   */
  static async unsubscribe(unsubscribeToken) {
    const subscriber = await StatusSubscriberRepository.unsubscribe(unsubscribeToken);
    if (!subscriber) throw new AppError('Invalid unsubscribe token', 400, 'INVALID_TOKEN');
    return { message: 'You have been unsubscribed successfully.' };
  }

  /**
   * Dispatch incident/maintenance email to all confirmed subscribers of an org.
   */
  static async notifySubscribers(organizationId, orgName, orgSlug, { subject, body }) {
    const subscribers = await StatusSubscriberRepository.findConfirmed(organizationId);
    if (subscribers.length === 0) return;

    for (const sub of subscribers) {
      const unsubUrl = `${FRONTEND_URL}/status/unsubscribe/${sub.unsubscribeToken}`;
      await enqueueNotification({
        organizationId,
        channel: 'email',
        recipient: sub.email,
        subject,
        body: `${body}<br><br><small><a href="${unsubUrl}">Unsubscribe</a> from ${orgName} status updates.</small>`,
      });
    }
    logger.info(`Status notification queued for ${subscribers.length} subscribers of org ${orgSlug}`);
  }
}

export default StatusSubscriberService;
