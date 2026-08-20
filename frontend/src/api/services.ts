import { apiRequest } from './client';
import type { ApiPaginatedResponse, ApiSuccess } from '../types/api';
import type { Service, ServiceGroup, HealthCheck } from '../types/domain';
import type {
  CreateServicePayload,
  UpdateServicePayload,
  CreateGroupPayload,
  UpdateGroupPayload,
  ServiceQueryParams,
} from '../types/services';

export async function listServices(
  params?: ServiceQueryParams
): Promise<ApiPaginatedResponse<Service>> {
  const query = new URLSearchParams();
  if (params?.page !== undefined) query.set('page', String(params.page));
  if (params?.limit !== undefined) query.set('limit', String(params.limit));
  if (params?.groupId) query.set('groupId', params.groupId);
  if (params?.search) query.set('search', params.search);

  // CRITICAL RULE: NEVER send status query parameter to GET /services
  const endpoint = `/services${query.toString() ? `?${query.toString()}` : ''}`;
  const response = await apiRequest<any>(endpoint, { method: 'GET' });

  let items: Service[] = [];
  if (Array.isArray(response.data)) {
    items = response.data;
  } else if (response.data && typeof response.data === 'object' && Array.isArray(response.data.services)) {
    items = response.data.services;
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

export async function getService(id: string): Promise<ApiSuccess<Service>> {
  const res = await apiRequest<any>(`/services/${id}`, { method: 'GET' });
  const service = res.data && typeof res.data === 'object' && 'service' in res.data ? res.data.service : res.data;
  return { ...res, data: service };
}

export async function createService(data: CreateServicePayload): Promise<ApiSuccess<Service>> {
  const res = await apiRequest<any>('/services', {
    method: 'POST',
    body: data,
  });
  const service = res.data && typeof res.data === 'object' && 'service' in res.data ? res.data.service : res.data;
  return { ...res, data: service };
}

export async function updateService(
  id: string,
  data: UpdateServicePayload
): Promise<ApiSuccess<Service>> {
  const res = await apiRequest<any>(`/services/${id}`, {
    method: 'PATCH',
    body: data,
  });
  const service = res.data && typeof res.data === 'object' && 'service' in res.data ? res.data.service : res.data;
  return { ...res, data: service };
}

export async function deleteService(id: string): Promise<ApiSuccess<{ message: string }>> {
  return apiRequest<{ message: string }>(`/services/${id}`, {
    method: 'DELETE',
  });
}

export async function listGroups(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<ApiPaginatedResponse<ServiceGroup>> {
  const query = new URLSearchParams();
  if (params?.page !== undefined) query.set('page', String(params.page));
  if (params?.limit !== undefined) query.set('limit', String(params.limit));
  if (params?.search) query.set('search', params.search);

  const endpoint = `/services/groups${query.toString() ? `?${query.toString()}` : ''}`;
  const response = await apiRequest<any>(endpoint, { method: 'GET' });

  let items: ServiceGroup[] = [];
  if (Array.isArray(response.data)) {
    items = response.data;
  } else if (response.data && typeof response.data === 'object' && Array.isArray(response.data.groups)) {
    items = response.data.groups;
  }

  const meta = (response as any).meta;
  const pagination = (response as any).pagination
    ? (response as any).pagination
    : meta
    ? {
        page: Number(meta.page) || 1,
        limit: Number(meta.limit) || 100,
        total: Number(meta.total) || items.length,
        totalPages: Math.max(1, Math.ceil((Number(meta.total) || items.length) / (Number(meta.limit) || 100))),
      }
    : undefined;

  return {
    success: true,
    data: items,
    pagination: pagination as any,
  };
}

export async function getGroup(id: string): Promise<ApiSuccess<ServiceGroup>> {
  const res = await apiRequest<any>(`/services/groups/${id}`, { method: 'GET' });
  const group = res.data && typeof res.data === 'object' && 'group' in res.data ? res.data.group : res.data;
  return { ...res, data: group };
}

export async function createGroup(data: CreateGroupPayload): Promise<ApiSuccess<ServiceGroup>> {
  const res = await apiRequest<any>('/services/groups', {
    method: 'POST',
    body: data,
  });
  const group = res.data && typeof res.data === 'object' && 'group' in res.data ? res.data.group : res.data;
  return { ...res, data: group };
}

export async function updateGroup(
  id: string,
  data: UpdateGroupPayload
): Promise<ApiSuccess<ServiceGroup>> {
  const res = await apiRequest<any>(`/services/groups/${id}`, {
    method: 'PATCH',
    body: data,
  });
  const group = res.data && typeof res.data === 'object' && 'group' in res.data ? res.data.group : res.data;
  return { ...res, data: group };
}

export async function deleteGroup(id: string): Promise<ApiSuccess<{ message: string }>> {
  return apiRequest<{ message: string }>(`/services/groups/${id}`, {
    method: 'DELETE',
  });
}

export async function getHealthChecks(
  serviceId: string,
  params?: { page?: number; limit?: number }
): Promise<ApiPaginatedResponse<HealthCheck>> {
  const query = new URLSearchParams();
  if (params?.page !== undefined) query.set('page', String(params.page));
  if (params?.limit !== undefined) query.set('limit', String(params.limit));

  const endpoint = `/health-checks/service/${serviceId}${query.toString() ? `?${query.toString()}` : ''}`;
  const response = await apiRequest<any>(endpoint, { method: 'GET' });

  let items: HealthCheck[] = [];
  if (Array.isArray(response.data)) {
    items = response.data;
  } else if (response.data && typeof response.data === 'object' && Array.isArray(response.data.healthChecks)) {
    items = response.data.healthChecks;
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
