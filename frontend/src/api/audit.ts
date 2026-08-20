import { apiRequest } from './client';
import type { ApiPaginatedResponse } from '../types/api';
import type { AuditLog } from '../types/domain';

export async function listAuditLogs(params?: {
  page?: number;
  limit?: number;
  entityType?: string;
  userId?: string;
}): Promise<ApiPaginatedResponse<AuditLog>> {
  const query = new URLSearchParams();
  if (params?.page !== undefined) query.set('page', String(params.page));
  if (params?.limit !== undefined) query.set('limit', String(params.limit));
  if (params?.entityType) query.set('entityType', params.entityType);
  if (params?.userId) query.set('userId', params.userId);

  const endpoint = `/audit-logs${query.toString() ? `?${query.toString()}` : ''}`;
  const response = await apiRequest<AuditLog[] | { auditLogs: AuditLog[] }>(endpoint, {
    method: 'GET',
  });

  // Handle both wrapped { auditLogs: AuditLog[] } and raw array payloads
  if (
    response &&
    'data' in response &&
    response.data &&
    typeof response.data === 'object' &&
    'auditLogs' in response.data
  ) {
    return {
      ...response,
      data: (response.data as { auditLogs: AuditLog[] }).auditLogs,
    } as ApiPaginatedResponse<AuditLog>;
  }

  return response as ApiPaginatedResponse<AuditLog>;
}
