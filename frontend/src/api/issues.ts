import { apiRequest } from './client';
import type { ApiPaginatedResponse, ApiSuccess } from '../types/api';
import type {
  Issue,
  ErrorEventDetail,
  IssueQueryParams,
  UpdateIssuePayload,
  CreateIncidentFromIssuePayload,
} from '../features/issues/types/issues';

export async function listIssues(
  params?: IssueQueryParams
): Promise<ApiPaginatedResponse<Issue>> {
  const query = new URLSearchParams();
  if (params?.page !== undefined) query.set('page', String(params.page));
  if (params?.limit !== undefined) query.set('limit', String(params.limit));
  if (params?.projectId) query.set('projectId', params.projectId);
  if (params?.status) query.set('status', params.status);
  if (params?.environment) query.set('environment', params.environment);
  if (params?.level) query.set('level', params.level);
  if (params?.search) query.set('search', params.search);
  if (params?.sortBy) query.set('sortBy', params.sortBy);
  if (params?.sortOrder) query.set('sortOrder', params.sortOrder);

  const endpoint = `/issues${query.toString() ? `?${query.toString()}` : ''}`;
  const response = await apiRequest<any>(endpoint, { method: 'GET' });

  let items: Issue[] = [];
  if (Array.isArray(response.data)) {
    items = response.data;
  } else if (response.data && typeof response.data === 'object' && Array.isArray(response.data.issues)) {
    items = response.data.issues;
  }

  const pagination = (response as any).pagination || {
    page: Number(params?.page) || 1,
    limit: Number(params?.limit) || 20,
    total: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / (Number(params?.limit) || 20))),
  };

  return {
    success: true,
    data: items,
    pagination,
  };
}

export async function getIssue(id: string): Promise<ApiSuccess<Issue>> {
  const response = await apiRequest<{ issue: Issue }>(`/issues/${id}`, { method: 'GET' });
  const issue = response.data?.issue || (response.data as unknown as Issue);
  return {
    ...response,
    data: issue,
  };
}

export async function getIssueEvents(
  id: string,
  params?: { page?: number; limit?: number }
): Promise<ApiPaginatedResponse<ErrorEventDetail>> {
  const query = new URLSearchParams();
  if (params?.page !== undefined) query.set('page', String(params.page));
  if (params?.limit !== undefined) query.set('limit', String(params.limit));

  const endpoint = `/issues/${id}/events${query.toString() ? `?${query.toString()}` : ''}`;
  const response = await apiRequest<any>(endpoint, { method: 'GET' });

  let items: ErrorEventDetail[] = [];
  if (Array.isArray(response.data)) {
    items = response.data;
  } else if (response.data && typeof response.data === 'object' && Array.isArray(response.data.events)) {
    items = response.data.events;
  }

  const pagination = (response as any).pagination || {
    page: Number(params?.page) || 1,
    limit: Number(params?.limit) || 20,
    total: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / (Number(params?.limit) || 20))),
  };

  return {
    success: true,
    data: items,
    pagination,
  };
}

export async function updateIssue(
  id: string,
  payload: UpdateIssuePayload
): Promise<ApiSuccess<Issue>> {
  const response = await apiRequest<{ issue: Issue }>(`/issues/${id}`, {
    method: 'PATCH',
    body: payload,
  });
  const issue = response.data?.issue || (response.data as unknown as Issue);
  return {
    ...response,
    data: issue,
  };
}

export async function createIncidentFromIssue(
  id: string,
  payload: CreateIncidentFromIssuePayload
): Promise<ApiSuccess<{ incident: any; issue: Issue }>> {
  return apiRequest<{ incident: any; issue: Issue }>(`/issues/${id}/incident`, {
    method: 'POST',
    body: payload,
  });
}
