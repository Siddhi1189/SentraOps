import { apiRequest } from './client';

export interface StatusPageSettings {
  id: string | null;
  organizationId: string;
  subdomain: string;
  customDomain: string | null;
  logoUrl: string | null;
  theme: string;
}

export async function fetchStatusPageSettings() {
  return apiRequest<{ settings: StatusPageSettings }>('/status-page-settings');
}

export async function updateStatusPageSettings(data: {
  subdomain?: string;
  customDomain?: string | null;
  logoUrl?: string | null;
  theme?: string;
}) {
  return apiRequest<{ settings: StatusPageSettings }>('/status-page-settings', {
    method: 'PATCH',
    body: data,
  });
}
