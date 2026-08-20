import { apiRequest } from './client';
import type { ApiPaginatedResponse, ApiSuccess } from '../types/api';
import type { Organization, User } from '../types/domain';

export async function getOrganization(): Promise<ApiSuccess<{ organization: Organization }>> {
  return apiRequest<{ organization: Organization }>('/organizations', { method: 'GET' });
}

export async function listMembers(params?: {
  page?: number;
  limit?: number;
}): Promise<ApiPaginatedResponse<User>> {
  const query = new URLSearchParams();
  if (params?.page !== undefined) query.set('page', String(params.page));
  if (params?.limit !== undefined) query.set('limit', String(params.limit));

  const endpoint = `/organizations/members${query.toString() ? `?${query.toString()}` : ''}`;
  const response = await apiRequest<User[] | { members: User[] }>(endpoint, { method: 'GET' });

  // Handle both wrapped { members: User[] } and raw array payloads
  if (response && 'data' in response && response.data && typeof response.data === 'object' && 'members' in response.data) {
    return {
      ...response,
      data: (response.data as { members: User[] }).members,
    } as ApiPaginatedResponse<User>;
  }

  return response as ApiPaginatedResponse<User>;
}

export async function inviteMember(data: {
  email: string;
  role: 'admin' | 'viewer';
}): Promise<ApiSuccess<{ email: string; role: string; status: string }>> {
  return apiRequest<{ email: string; role: string; status: string }>('/organizations/invite', {
    method: 'POST',
    body: data,
  });
}

export async function updateMemberRole(
  userId: string,
  role: 'admin' | 'viewer'
): Promise<ApiSuccess<{ user: User }>> {
  return apiRequest<{ user: User }>(`/organizations/members/${userId}/role`, {
    method: 'PATCH',
    body: { role },
  });
}

export async function removeMember(userId: string): Promise<ApiSuccess<{ message: string }>> {
  return apiRequest<{ message: string }>(`/organizations/members/${userId}`, {
    method: 'DELETE',
  });
}
