import { apiRequest } from './client';
import type {
  CreateMaintenancePayload,
  UpdateMaintenancePayload,
  MaintenanceQueryParams,
  MaintenanceWindowDetail,
} from '../features/maintenance/types/maintenance';
import type { ApiPaginatedResponse, ApiSuccess } from '../types/api';

export async function listMaintenance(
  params?: MaintenanceQueryParams
): Promise<ApiPaginatedResponse<MaintenanceWindowDetail>> {
  const query = new URLSearchParams();
  if (params?.page) query.append('page', String(params.page));
  if (params?.limit) query.append('limit', String(params.limit));

  const queryString = query.toString();
  const endpoint = queryString ? `/maintenance?${queryString}` : '/maintenance';

  const response = await apiRequest<any>(endpoint, { method: 'GET' });

  let items: MaintenanceWindowDetail[] = [];
  if (Array.isArray(response.data)) {
    items = response.data;
  } else if (response.data && typeof response.data === 'object' && Array.isArray(response.data.maintenanceWindows)) {
    items = response.data.maintenanceWindows;
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

export async function getMaintenance(id: string): Promise<ApiSuccess<MaintenanceWindowDetail>> {
  const res = await apiRequest<any>(`/maintenance/${id}`, { method: 'GET' });
  const window = res.data && typeof res.data === 'object' && 'maintenanceWindow' in res.data ? res.data.maintenanceWindow : res.data;
  return { ...res, data: window };
}

export async function createMaintenance(
  data: CreateMaintenancePayload
): Promise<ApiSuccess<MaintenanceWindowDetail>> {
  const { title, description, startTime, endTime, serviceId } = data as any;
  const payload = { title, description, startTime, endTime, serviceId };

  const res = await apiRequest<any>('/maintenance', {
    method: 'POST',
    body: payload,
  });
  const window = res.data && typeof res.data === 'object' && 'maintenanceWindow' in res.data ? res.data.maintenanceWindow : res.data;
  return { ...res, data: window };
}

export async function updateMaintenance(
  id: string,
  data: UpdateMaintenancePayload
): Promise<ApiSuccess<MaintenanceWindowDetail>> {
  const { title, description, startTime, endTime, serviceId } = data as any;
  const payload: Record<string, unknown> = {};
  if (title !== undefined) payload.title = title;
  if (description !== undefined) payload.description = description;
  if (startTime !== undefined) payload.startTime = startTime;
  if (endTime !== undefined) payload.endTime = endTime;
  if (serviceId !== undefined) payload.serviceId = serviceId;

  const res = await apiRequest<any>(`/maintenance/${id}`, {
    method: 'PATCH',
    body: payload,
  });
  const window = res.data && typeof res.data === 'object' && 'maintenanceWindow' in res.data ? res.data.maintenanceWindow : res.data;
  return { ...res, data: window };
}

export async function deleteMaintenance(
  id: string
): Promise<ApiSuccess<{ message: string }>> {
  return apiRequest<{ message: string }>(`/maintenance/${id}`, {
    method: 'DELETE',
  }) as unknown as Promise<ApiSuccess<{ message: string }>>;
}
