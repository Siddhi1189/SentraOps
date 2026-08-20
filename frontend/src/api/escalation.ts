import { apiRequest } from './client';
import type { ApiSuccess } from '../types/api';
import type { EscalationPolicy } from '../types/domain';
import type { UpsertEscalationPolicyPayload } from '../features/escalation/types/escalation';

export async function listEscalationPolicies(): Promise<ApiSuccess<EscalationPolicy[]>> {
  const res = await apiRequest<EscalationPolicy[] | { policies: EscalationPolicy[] }>('/escalation-policies', {
    method: 'GET',
  });
  const data = Array.isArray(res.data) ? res.data : (res.data as any)?.policies || [];
  return { ...res, data };
}

export async function getEscalationPolicy(id: string): Promise<ApiSuccess<EscalationPolicy>> {
  const res = await apiRequest<EscalationPolicy | { policy: EscalationPolicy }>(`/escalation-policies/${id}`, {
    method: 'GET',
  });
  const policy = (res.data as any)?.policy || res.data;
  return { ...res, data: policy };
}

export async function upsertEscalationPolicy(
  data: UpsertEscalationPolicyPayload
): Promise<ApiSuccess<EscalationPolicy>> {
  const payload = {
    serviceId: data.serviceId || null,
    warningThreshold: data.warningThreshold,
    incidentThreshold: data.incidentThreshold,
    criticalThreshold: data.criticalThreshold,
  };

  const res = await apiRequest<EscalationPolicy | { policy: EscalationPolicy }>('/escalation-policies', {
    method: 'POST',
    body: payload,
  });
  const policy = (res.data as any)?.policy || res.data;
  return { ...res, data: policy };
}

export async function deleteEscalationPolicy(
  id: string
): Promise<ApiSuccess<{ message: string }>> {
  return apiRequest<{ message: string }>(`/escalation-policies/${id}`, {
    method: 'DELETE',
  });
}
