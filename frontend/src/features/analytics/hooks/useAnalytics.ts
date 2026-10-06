import { useQuery } from '@tanstack/react-query';
import {
  getServiceAnalytics,
  getIncidentAnalytics,
  getServicePerformance,
} from '../../../api/analytics';
import { analyticsKeys } from '../../../lib/queryKeys';

export function useServiceAnalyticsQuery(serviceId: string, enabled = true) {
  return useQuery({
    queryKey: analyticsKeys.service(serviceId),
    queryFn: () => getServiceAnalytics(serviceId),
    enabled: enabled && !!serviceId,
  });
}

export function useServicePerformanceQuery(serviceId: string, enabled = true) {
  return useQuery({
    queryKey: [...analyticsKeys.service(serviceId), 'performance'],
    queryFn: () => getServicePerformance(serviceId),
    enabled: enabled && !!serviceId,
  });
}

export function useIncidentAnalyticsQuery(filters?: { serviceId?: string }) {
  return useQuery({
    queryKey: analyticsKeys.incidents(filters),
    queryFn: () => getIncidentAnalytics(filters),
  });
}
