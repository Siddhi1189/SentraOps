import type { QueryClient } from '@tanstack/react-query';
import {
  incidentsKeys,
  servicesKeys,
  maintenanceKeys,
  analyticsKeys,
} from './queryKeys';

export interface IncidentCreatedPayload {
  incident: {
    id: string;
    title: string;
    status: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    serviceId: string;
    organizationId: string;
    service?: { id: string; name: string } | null;
  };
}

export interface IncidentUpdatedPayload {
  incidentId: string;
  status?: string;
  severity?: string;
  resolvedAt?: string | Date;
}

export interface HealthCheckUpdatedPayload {
  serviceId: string;
  status: string;
  consecutiveFailures: number;
  responseTimeMs: number;
  errorMessage?: string;
  checkedAt: string | Date;
}

export interface MaintenanceStartedPayload {
  maintenanceId?: string;
  serviceId?: string;
}

export interface MaintenanceEndedPayload {
  maintenanceId?: string;
}

export interface SocketEventCallbacks {
  onIncidentCreated?: (incident: IncidentCreatedPayload['incident']) => void;
  onIncidentUpdated?: (payload: IncidentUpdatedPayload) => void;
}

/**
 * Maps confirmed Socket.IO events to precise existing TanStack Query invalidation targets
 * in queryKeys.ts.
 */
export function handleSocketEvent(
  queryClient: QueryClient,
  eventName: string,
  payload: unknown,
  callbacks?: SocketEventCallbacks
): void {
  switch (eventName) {
    case 'incident-created': {
      const data = payload as IncidentCreatedPayload;
      queryClient.invalidateQueries({ queryKey: incidentsKeys.all });
      queryClient.invalidateQueries({ queryKey: servicesKeys.all });
      queryClient.invalidateQueries({ queryKey: analyticsKeys.all });
      if (data?.incident) {
        callbacks?.onIncidentCreated?.(data.incident);
      }
      break;
    }

    case 'incident-updated': {
      const data = payload as IncidentUpdatedPayload;
      queryClient.invalidateQueries({ queryKey: incidentsKeys.all });
      queryClient.invalidateQueries({ queryKey: servicesKeys.all });
      queryClient.invalidateQueries({ queryKey: analyticsKeys.all });
      if (data?.incidentId) {
        queryClient.invalidateQueries({ queryKey: incidentsKeys.detail(data.incidentId) });
      }
      callbacks?.onIncidentUpdated?.(data);
      break;
    }

    case 'health-check-updated': {
      const data = payload as HealthCheckUpdatedPayload;
      queryClient.invalidateQueries({ queryKey: servicesKeys.all });
      queryClient.invalidateQueries({ queryKey: analyticsKeys.all });
      if (data?.serviceId) {
        queryClient.invalidateQueries({ queryKey: servicesKeys.detail(data.serviceId) });
      }
      break;
    }

    case 'maintenance-started':
    case 'maintenance-ended': {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.all });
      queryClient.invalidateQueries({ queryKey: servicesKeys.all });
      break;
    }

    default:
      break;
  }
}
