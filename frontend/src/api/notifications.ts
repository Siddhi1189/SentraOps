import { apiRequest } from './client';

export interface NotificationItem {
  id: string;
  channel: 'email' | 'slack' | 'discord' | 'webhook';
  recipient: string;
  status: 'pending' | 'sent' | 'failed';
  sentAt: string | null;
  createdAt: string;
  title: string;
  isRead: boolean;
  incident?: {
    id: string;
    title: string;
    severity: string;
  } | null;
  maintenance?: {
    id: string;
    title: string;
  } | null;
}

export interface NotificationsListResponse {
  notifications: NotificationItem[];
  unreadCount: number;
}

export async function fetchNotifications(params: {
  page?: number;
  limit?: number;
  status?: string;
} = {}) {
  const searchParams = new URLSearchParams();
  if (params.page) searchParams.set('page', params.page.toString());
  if (params.limit) searchParams.set('limit', params.limit.toString());
  if (params.status) searchParams.set('status', params.status);

  const query = searchParams.toString();
  const endpoint = query ? `/notifications?${query}` : '/notifications';

  return apiRequest<NotificationsListResponse>(endpoint);
}

export async function markNotificationAsRead(id: string) {
  return apiRequest<{ message: string }>(`/notifications/${id}/read`, {
    method: 'PATCH',
  });
}

export async function markAllNotificationsAsRead() {
  return apiRequest<{ message: string }>('/notifications/read-all', {
    method: 'PATCH',
  });
}
