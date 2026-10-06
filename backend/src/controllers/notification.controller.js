import NotificationService from '../services/notificationService.js';
import ApiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

const listNotifications = asyncHandler(async (req, res) => {
  const { notifications, total, unreadCount } = await NotificationService.listNotifications(
    req.user.organizationId,
    req.user.id,
    req.query
  );
  return ApiResponse.success(
    res,
    { notifications, unreadCount },
    200,
    { total, page: +req.query.page || 1, limit: +req.query.limit || 20 }
  );
});

const markAsRead = asyncHandler(async (req, res) => {
  await NotificationService.markAsRead(
    req.user.organizationId,
    req.user.id,
    req.params.id
  );
  return ApiResponse.success(res, { message: 'Notification marked as read' });
});

const markAllAsRead = asyncHandler(async (req, res) => {
  await NotificationService.markAllAsRead(
    req.user.organizationId,
    req.user.id
  );
  return ApiResponse.success(res, { message: 'All notifications marked as read' });
});

export { listNotifications, markAsRead, markAllAsRead };
export default { listNotifications, markAsRead, markAllAsRead };
