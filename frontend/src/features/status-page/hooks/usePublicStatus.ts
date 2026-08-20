import { useQuery } from '@tanstack/react-query';
import { statusKeys } from '../../../lib/queryKeys';
import {
  getStatusPageOverview,
  getStatusPageIncidents,
  getStatusPageMaintenance,
} from '../../../api/status';

export function usePublicStatusOverviewQuery(orgSlug: string) {
  return useQuery({
    queryKey: statusKeys.overview(orgSlug),
    queryFn: () => getStatusPageOverview(orgSlug),
    enabled: Boolean(orgSlug),
  });
}

export function usePublicStatusIncidentsQuery(orgSlug: string) {
  return useQuery({
    queryKey: statusKeys.incidents(orgSlug),
    queryFn: () => getStatusPageIncidents(orgSlug),
    enabled: Boolean(orgSlug),
  });
}

export function usePublicStatusMaintenanceQuery(orgSlug: string) {
  return useQuery({
    queryKey: statusKeys.maintenance(orgSlug),
    queryFn: () => getStatusPageMaintenance(orgSlug),
    enabled: Boolean(orgSlug),
  });
}
