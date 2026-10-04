import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { issuesKeys } from '../../../lib/queryKeys';
import { useToast } from '../../../app/providers/ToastProvider';
import {
  listIssues,
  getIssue,
  getIssueEvents,
  updateIssue,
  createIncidentFromIssue,
} from '../../../api/issues';
import type {
  IssueQueryParams,
  UpdateIssuePayload,
  CreateIncidentFromIssuePayload,
} from '../types/issues';
import type { ApiError } from '../../../types/api';

export function useIssuesQuery(filters?: IssueQueryParams) {
  return useQuery({
    queryKey: issuesKeys.list(filters),
    queryFn: () => listIssues(filters),
  });
}

export function useIssueQuery(id: string) {
  return useQuery({
    queryKey: issuesKeys.detail(id),
    queryFn: () => getIssue(id),
    enabled: !!id,
  });
}

export function useIssueEventsQuery(id: string, params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: issuesKeys.events(id, params),
    queryFn: () => getIssueEvents(id, params),
    enabled: !!id,
  });
}

export function useUpdateIssueMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateIssuePayload }) =>
      updateIssue(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: issuesKeys.all });
      queryClient.invalidateQueries({ queryKey: issuesKeys.detail(id) });
      toast.showToast('Issue updated successfully', 'success');
    },
    onError: (err: ApiError) => {
      if (err.status !== 409 && err.error?.code !== 'CONCURRENCY_ERROR') {
        toast.showToast(err.error?.message || 'Failed to update issue', 'error');
      }
    },
  });
}

export function useCreateIncidentFromIssueMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateIncidentFromIssuePayload }) =>
      createIncidentFromIssue(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: issuesKeys.all });
      queryClient.invalidateQueries({ queryKey: issuesKeys.detail(id) });
      toast.showToast('Incident created and linked to issue', 'success');
    },
    onError: (err: ApiError) => {
      toast.showToast(err.error?.message || 'Failed to create incident from issue', 'error');
    },
  });
}
