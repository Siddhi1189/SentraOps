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

export interface ServicePerformanceWindow {
  totalChecks: number;
  upChecks: number;
  uptimePercentage: number;
  p50: number;
  p95: number;
  p99: number;
}

export interface ServiceTimeSeriesPoint {
  id: string;
  status: string;
  responseTimeMs: number | null;
  checkedAt: string;
}

export interface ServicePerformanceData {
  serviceId: string;
  windows: {
    '24h': ServicePerformanceWindow;
    '7d': ServicePerformanceWindow;
    '30d': ServicePerformanceWindow;
  };
  timeSeries: ServiceTimeSeriesPoint[];
  sparkline: number[];
  ssl: {
    daysRemaining: number;
    checkedAt: string;
  } | null;
}

export async function getServicePerformance(
  serviceId: string
): Promise<ApiSuccess<ServicePerformanceData>> {
  return apiRequest<ServicePerformanceData>(`/analytics/services/${serviceId}/performance`, {
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
