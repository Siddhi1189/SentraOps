import { apiRequest } from './client';
import type { ApiPaginatedResponse, ApiSuccess } from '../types/api';
import type { User } from '../types/domain';
import type {
  IncidentDetail,
  TimelineEvent,
  UpdateIncidentPayload,
  IncidentQueryParams,
  MemberQueryParams,
} from '../features/incidents/types/incidents';

export async function listIncidents(
  params?: IncidentQueryParams
): Promise<ApiPaginatedResponse<IncidentDetail>> {
  const query = new URLSearchParams();
  if (params?.page !== undefined) query.set('page', String(params.page));
  if (params?.limit !== undefined) query.set('limit', String(params.limit));
  if (params?.status) query.set('status', params.status);
  if (params?.severity) query.set('severity', params.severity);
  if (params?.serviceId) query.set('serviceId', params.serviceId);

  const endpoint = `/incidents${query.toString() ? `?${query.toString()}` : ''}`;
  const response = await apiRequest<any>(endpoint, { method: 'GET' });

  let items: IncidentDetail[] = [];
  if (Array.isArray(response.data)) {
    items = response.data;
  } else if (response.data && typeof response.data === 'object' && Array.isArray(response.data.incidents)) {
    items = response.data.incidents;
  }

  const meta = (response as any).meta;
  const pagination = (response as any).pagination
    ? (response as any).pagination
    : meta
    ? {
        page: Number(meta.page) || 1,
        limit: Number(meta.limit) || 10,
        total: Number(meta.total) || items.length,
        totalPages: Math.max(1, Math.ceil((Number(meta.total) || items.length) / (Number(meta.limit) || 10))),
      }
    : undefined;

  return {
    success: true,
    data: items,
    pagination: pagination as any,
  };
}

export async function getIncident(id: string): Promise<ApiSuccess<IncidentDetail>> {
  const res = await apiRequest<any>(`/incidents/${id}`, { method: 'GET' });
  const incident = res.data && typeof res.data === 'object' && 'incident' in res.data ? res.data.incident : res.data;
  return { ...res, data: incident };
}

export async function updateIncident(
  id: string,
  data: UpdateIncidentPayload
): Promise<ApiSuccess<IncidentDetail>> {
  const res = await apiRequest<any>(`/incidents/${id}`, {
    method: 'PATCH',
    body: data,
  });
  const incident = res.data && typeof res.data === 'object' && 'incident' in res.data ? res.data.incident : res.data;
  return { ...res, data: incident };
}

export async function getIncidentTimeline(id: string): Promise<ApiSuccess<TimelineEvent[]>> {
  const res = await apiRequest<any>(`/incidents/${id}/timeline`, { method: 'GET' });
  const events = res.data && typeof res.data === 'object' && 'events' in res.data ? res.data.events : (Array.isArray(res.data) ? res.data : []);
  return { ...res, data: events };
}

export async function listOrganizationMembers(
  params?: MemberQueryParams
): Promise<ApiPaginatedResponse<User>> {
  const query = new URLSearchParams();
  if (params?.page !== undefined) query.set('page', String(params.page));
  if (params?.limit !== undefined) query.set('limit', String(params.limit));
  if (params?.search) query.set('search', params.search);

  const endpoint = `/organizations/members${query.toString() ? `?${query.toString()}` : ''}`;
  const response = await apiRequest<any>(endpoint, { method: 'GET' });

  let items: User[] = [];
  if (Array.isArray(response.data)) {
    items = response.data;
  } else if (response.data && typeof response.data === 'object' && Array.isArray(response.data.members)) {
    items = response.data.members;
  }

  const meta = (response as any).meta;
  const pagination = (response as any).pagination
    ? (response as any).pagination
    : meta
    ? {
        page: Number(meta.page) || 1,
        limit: Number(meta.limit) || 10,
        total: Number(meta.total) || items.length,
        totalPages: Math.max(1, Math.ceil((Number(meta.total) || items.length) / (Number(meta.limit) || 10))),
      }
    : undefined;

  return {
    success: true,
    data: items,
    pagination: pagination as any,
  };
}
