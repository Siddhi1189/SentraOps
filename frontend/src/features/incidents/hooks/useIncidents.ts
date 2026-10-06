import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { incidentsKeys, organizationsKeys } from '../../../lib/queryKeys';
import { useToast } from '../../../app/providers/ToastProvider';
import {
  listIncidents,
  getIncident,
  updateIncident,
  getIncidentTimeline,
  listOrganizationMembers,
  acknowledgeIncident,
  addIncidentComment,
} from '../../../api/incidents';
import type {
  IncidentQueryParams,
  UpdateIncidentPayload,
  MemberQueryParams,
} from '../types/incidents';
import type { ApiError } from '../../../types/api';

export function useIncidentsQuery(filters?: IncidentQueryParams) {
  return useQuery({
    queryKey: incidentsKeys.list(filters),
    queryFn: () => listIncidents(filters),
  });
}

export function useIncidentQuery(id: string) {
  return useQuery({
    queryKey: incidentsKeys.detail(id),
    queryFn: () => getIncident(id),
    enabled: !!id,
  });
}

export function useIncidentTimelineQuery(id: string) {
  return useQuery({
    queryKey: incidentsKeys.timeline(id),
    queryFn: () => getIncidentTimeline(id),
    enabled: !!id,
  });
}

export function useUpdateIncidentMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateIncidentPayload }) =>
      updateIncident(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: incidentsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: incidentsKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: incidentsKeys.timeline(id) });
      toast.showToast('Incident updated successfully', 'success');
    },
    onError: (err: ApiError) => {
      // For 409 Concurrency Error, component handles conflict banner.
      if (err.status !== 409 && err.error?.code !== 'CONCURRENCY_ERROR') {
        toast.showToast(err.error?.message || 'Failed to update incident', 'error');
      }
    },
  });
}

export function useOrganizationMembersQuery(filters?: MemberQueryParams) {
  return useQuery({
    queryKey: [...organizationsKeys.members(), { filters }],
    queryFn: () => listOrganizationMembers(filters),
  });
}

export function useAcknowledgeIncidentMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, updatedAt }: { id: string; updatedAt?: string }) =>
      acknowledgeIncident(id, updatedAt),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: incidentsKeys.lists() });
      queryClient.invalidateQueries({ queryKey: incidentsKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: incidentsKeys.timeline(id) });
      toast.showToast('Incident acknowledged', 'success');
    },
    onError: (err: ApiError) => {
      toast.showToast(err.error?.message || 'Failed to acknowledge incident', 'error');
    },
  });
}

export function useAddIncidentCommentMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, comment }: { id: string; comment: string }) =>
      addIncidentComment(id, comment),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: incidentsKeys.timeline(id) });
      toast.showToast('Note added to timeline', 'success');
    },
    onError: (err: ApiError) => {
      toast.showToast(err.error?.message || 'Failed to add note', 'error');
    },
  });
}

