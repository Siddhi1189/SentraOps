import prisma from '../config/db.js';
import crypto from 'crypto';

class StatusSubscriberRepository {
  /**
   * Subscribe an email to an org's status page (double opt-in).
   * Returns existing record if already subscribed (so resend works).
   */
  static async subscribe(organizationId, email) {
    const confirmToken = crypto.randomBytes(32).toString('hex');
    const unsubscribeToken = crypto.randomBytes(32).toString('hex');

    // Upsert: if already pending, replace tokens so they can resend
    const existing = await prisma.statusSubscriber.findUnique({
      where: { organizationId_email: { organizationId, email } },
    });

    if (existing && existing.confirmedAt) {
      // Already confirmed — return as-is (idempotent)
      return { subscriber: existing, isNew: false };
    }

    if (existing) {
      // Pending — refresh tokens
      const updated = await prisma.statusSubscriber.update({
        where: { id: existing.id },
        data: { confirmToken, unsubscribeToken },
      });
      return { subscriber: updated, isNew: false };
    }

    const subscriber = await prisma.statusSubscriber.create({
      data: { organizationId, email, confirmToken, unsubscribeToken },
    });
    return { subscriber, isNew: true };
  }

  /**
   * Confirm subscription via token.
   */
  static async confirm(confirmToken) {
    const subscriber = await prisma.statusSubscriber.findUnique({
      where: { confirmToken },
    });
    if (!subscriber) return null;
    if (subscriber.confirmedAt) return subscriber; // already confirmed

    return prisma.statusSubscriber.update({
      where: { id: subscriber.id },
      data: { confirmedAt: new Date() },
    });
  }

  /**
   * Unsubscribe via token.
   */
  static async unsubscribe(unsubscribeToken) {
    const subscriber = await prisma.statusSubscriber.findUnique({
      where: { unsubscribeToken },
    });
    if (!subscriber) return null;

    await prisma.statusSubscriber.delete({ where: { id: subscriber.id } });
    return subscriber;
  }

  /**
   * Find all confirmed subscribers for an organization.
   */
  static async findConfirmed(organizationId) {
    return prisma.statusSubscriber.findMany({
      where: { organizationId, confirmedAt: { not: null } },
      select: { email: true, unsubscribeToken: true },
    });
  }
}

export default StatusSubscriberRepository;
