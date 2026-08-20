import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { escalationPolicyKeys } from '../../../lib/queryKeys';
import { useToast } from '../../../app/providers/ToastProvider';
import {
  listEscalationPolicies,
  getEscalationPolicy,
  upsertEscalationPolicy,
  deleteEscalationPolicy,
} from '../../../api/escalation';
import type { UpsertEscalationPolicyPayload } from '../types/escalation';
import type { ApiError } from '../../../types/api';

export function useEscalationPoliciesQuery() {
  return useQuery({
    queryKey: escalationPolicyKeys.all,
    queryFn: () => listEscalationPolicies(),
  });
}

export function useEscalationPolicyDetailQuery(id: string) {
  return useQuery({
    queryKey: escalationPolicyKeys.detail(id),
    queryFn: () => getEscalationPolicy(id),
    enabled: !!id,
  });
}

export function useUpsertEscalationPolicyMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: UpsertEscalationPolicyPayload) => upsertEscalationPolicy(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: escalationPolicyKeys.all });
      toast.showToast('Escalation policy saved successfully', 'success');
    },
    onError: (err: ApiError) => {
      toast.showToast(err.error?.message || 'Failed to save escalation policy', 'error');
    },
  });
}

export function useDeleteEscalationPolicyMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteEscalationPolicy(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: escalationPolicyKeys.all });
      queryClient.invalidateQueries({ queryKey: escalationPolicyKeys.detail(id) });
      toast.showToast('Escalation policy deleted successfully', 'success');
    },
    onError: (err: ApiError) => {
      toast.showToast(err.error?.message || 'Failed to delete escalation policy', 'error');
    },
  });
}
