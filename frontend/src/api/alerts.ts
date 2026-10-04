import { apiRequest } from './client';
import type { ApiSuccess } from '../types/api';
import type {
  AlertChannel,
  AlertRule,
  CreateAlertChannelPayload,
  UpdateAlertChannelPayload,
  CreateAlertRulePayload,
  UpdateAlertRulePayload,
} from '../features/alerts/types/alerts';

// ========================
// Alert Channels API
// ========================

export async function listAlertChannels(): Promise<ApiSuccess<AlertChannel[]>> {
  const response = await apiRequest<AlertChannel[]>('/alert-channels', { method: 'GET' });
  const channels = Array.isArray(response.data) ? response.data : [];
  return {
    ...response,
    data: channels,
  };
}

export async function getAlertChannel(id: string): Promise<ApiSuccess<AlertChannel>> {
  return apiRequest<AlertChannel>(`/alert-channels/${id}`, { method: 'GET' });
}

export async function createAlertChannel(
  data: CreateAlertChannelPayload
): Promise<ApiSuccess<AlertChannel>> {
  return apiRequest<AlertChannel>('/alert-channels', {
    method: 'POST',
    body: data,
  });
}

export async function updateAlertChannel(
  id: string,
  data: UpdateAlertChannelPayload
): Promise<ApiSuccess<AlertChannel>> {
  return apiRequest<AlertChannel>(`/alert-channels/${id}`, {
    method: 'PATCH',
    body: data,
  });
}

export async function deleteAlertChannel(id: string): Promise<ApiSuccess<{ id: string }>> {
  return apiRequest<{ id: string }>(`/alert-channels/${id}`, { method: 'DELETE' });
}

export async function testAlertChannel(id: string): Promise<ApiSuccess<{ success: boolean; message: string }>> {
  return apiRequest<{ success: boolean; message: string }>(`/alert-channels/${id}/test`, {
    method: 'POST',
  });
}

// ========================
// Alert Rules API
// ========================

export async function listAlertRules(): Promise<ApiSuccess<AlertRule[]>> {
  const response = await apiRequest<AlertRule[]>('/alert-rules', { method: 'GET' });
  const rules = Array.isArray(response.data) ? response.data : [];
  return {
    ...response,
    data: rules,
  };
}

export async function getAlertRule(id: string): Promise<ApiSuccess<AlertRule>> {
  return apiRequest<AlertRule>(`/alert-rules/${id}`, { method: 'GET' });
}

export async function createAlertRule(
  data: CreateAlertRulePayload
): Promise<ApiSuccess<AlertRule>> {
  return apiRequest<AlertRule>('/alert-rules', {
    method: 'POST',
    body: data,
  });
}

export async function updateAlertRule(
  id: string,
  data: UpdateAlertRulePayload
): Promise<ApiSuccess<AlertRule>> {
  return apiRequest<AlertRule>(`/alert-rules/${id}`, {
    method: 'PATCH',
    body: data,
  });
}

export async function deleteAlertRule(id: string): Promise<ApiSuccess<{ id: string }>> {
  return apiRequest<{ id: string }>(`/alert-rules/${id}`, { method: 'DELETE' });
}

export async function snoozeAlertRule(
  id: string,
  until: string
): Promise<ApiSuccess<AlertRule>> {
  return apiRequest<AlertRule>(`/alert-rules/${id}/snooze`, {
    method: 'POST',
    body: { until },
  });
}

export async function unsnoozeAlertRule(id: string): Promise<ApiSuccess<AlertRule>> {
  return apiRequest<AlertRule>(`/alert-rules/${id}/snooze`, {
    method: 'DELETE',
  });
}
