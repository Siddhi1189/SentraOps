import { apiRequest } from './client';
import type { ApiSuccess } from '../types/api';
import type { ServiceAnalyticsData, IncidentAnalyticsData } from '../features/analytics/types/analytics';

export async function getServiceAnalytics(
  serviceId: string
): Promise<ApiSuccess<ServiceAnalyticsData>> {
  return apiRequest<ServiceAnalyticsData>(`/analytics/services/${serviceId}`, {
    method: 'GET',
  });
}

export async function getIncidentAnalytics(params?: {
  serviceId?: string;
}): Promise<ApiSuccess<IncidentAnalyticsData>> {
  const query = new URLSearchParams();
  if (params?.serviceId) query.set('serviceId', params.serviceId);

  const endpoint = `/analytics/incidents${query.toString() ? `?${query.toString()}` : ''}`;
  return apiRequest<IncidentAnalyticsData>(endpoint, { method: 'GET' });
}
