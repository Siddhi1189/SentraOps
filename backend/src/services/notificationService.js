import NotificationRepository from '../repositories/notification.repository.js';
import AppError from '../utils/AppError.js';

class NotificationService {
  /**
   * List notifications for an organization with per-user read tracking
   * @param {string} organizationId
   * @param {string} userId
   * @param {Object} query
   */
  static async listNotifications(organizationId, userId, query = {}) {
    const page = parseInt(query.page, 10) || 1;
    const limit = parseInt(query.limit, 10) || 20;
    const status = query.status;

    return NotificationRepository.findManyForUser(organizationId, userId, {
      page,
      limit,
      status,
    });
  }

  /**
   * Mark a notification as read for a user
   * @param {string} organizationId
   * @param {string} userId
   * @param {string} notificationId
   */
  static async markAsRead(organizationId, userId, notificationId) {
    const result = await NotificationRepository.markAsRead(notificationId, userId, organizationId);
    if (!result) {
      throw new AppError('Notification not found', 404, 'NOT_FOUND');
    }
    return { success: true };
  }

  /**
   * Mark all notifications in an organization as read for a user
   * @param {string} organizationId
   * @param {string} userId
   */
  static async markAllAsRead(organizationId, userId) {
    await NotificationRepository.markAllAsRead(organizationId, userId);
    return { success: true };
  }
}

export default NotificationService;
