import { apiRequest } from './client';
import type { ApiSuccess } from '../types/api';
import type { Incident, MaintenanceWindow } from '../types/domain';

export interface StatusPageSettings {
  id: string;
  organizationId: string;
  companyName: string;
  subdomain: string;
  logoUrl: string | null;
  theme: string | null;
  createdAt: string;
  updatedAt: string;
  organization?: {
    id: string;
    name: string;
    slug: string;
  };
}

export interface StatusPageService {
  id: string;
  name: string;
  currentStatus: 'up' | 'degraded' | 'down';
  environment?: string;
  group?: { id: string; name: string } | null;
}

export interface StatusPageOpenIncident {
  id: string;
  title: string;
  status: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  detectedAt: string;
  service?: { id: string; name: string } | null;
}

export interface StatusPageMaintenanceWindow {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  status: string;
  service?: { id: string; name: string } | null;
}

export interface StatusPageOverviewData {
  settings: StatusPageSettings;
  services: StatusPageService[];
  openIncidents: StatusPageOpenIncident[];
  maintenance: StatusPageMaintenanceWindow[];
}

export async function getStatusPageOverview(
  orgSlug: string
): Promise<ApiSuccess<StatusPageOverviewData>> {
  return apiRequest<StatusPageOverviewData>(`/status/${orgSlug}`, {
    method: 'GET',
    isPublic: true,
  });
}

export async function getStatusPageIncidents(
  orgSlug: string
): Promise<ApiSuccess<{ incidents: Incident[] }>> {
  return apiRequest<{ incidents: Incident[] }>(`/status/${orgSlug}/incidents`, {
    method: 'GET',
    isPublic: true,
  });
}

export async function getStatusPageMaintenance(
  orgSlug: string
): Promise<ApiSuccess<{ maintenance: MaintenanceWindow[] }>> {
  return apiRequest<{ maintenance: MaintenanceWindow[] }>(`/status/${orgSlug}/maintenance`, {
    method: 'GET',
    isPublic: true,
  });
}
