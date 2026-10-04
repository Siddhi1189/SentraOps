import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { servicesKeys } from '../../../lib/queryKeys';
import { useToast } from '../../../app/providers/ToastProvider';
import {
  listServices,
  getService,
  createService,
  updateService,
  deleteService,
  listGroups,
  createGroup,
  updateGroup,
  deleteGroup,
  getHealthChecks,
  pauseService,
  resumeService,
  checkNow,
  bulkPause,
  bulkResume,
  bulkInterval,
  bulkGroup,
  bulkDelete,
} from '../../../api/services';
import type {
  CreateServicePayload,
  UpdateServicePayload,
  CreateGroupPayload,
  UpdateGroupPayload,
  ServiceQueryParams,
} from '../../../types/services';
import type { ApiError } from '../../../types/api';

export function useServicesQuery(filters?: ServiceQueryParams) {
  return useQuery({
    queryKey: servicesKeys.list(filters),
    queryFn: () => listServices(filters),
  });
}

export function useServiceQuery(id: string) {
  return useQuery({
    queryKey: servicesKeys.detail(id),
    queryFn: () => getService(id),
    enabled: !!id,
  });
}

export function useCreateServiceMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: CreateServicePayload) => createService(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: servicesKeys.lists() });
      toast.showToast('Service created successfully', 'success');
    },
    onError: (err: ApiError) => {
      toast.showToast(err.error?.message || 'Failed to create service', 'error');
    },
  });
}

export function useUpdateServiceMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateServicePayload }) =>
      updateService(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: servicesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: servicesKeys.detail(id) });
      toast.showToast('Service updated successfully', 'success');
    },
    onError: (err: ApiError) => {
      toast.showToast(err.error?.message || 'Failed to update service', 'error');
    },
  });
}

export function useDeleteServiceMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteService(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: servicesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: servicesKeys.detail(id) });
      toast.showToast('Service deleted successfully', 'success');
    },
    onError: (err: ApiError) => {
      toast.showToast(err.error?.message || 'Failed to delete service', 'error');
    },
  });
}

export function useGroupsQuery(filters?: { page?: number; limit?: number; search?: string }) {
  return useQuery({
    queryKey: servicesKeys.groupList(filters),
    queryFn: () => listGroups(filters),
  });
}

export function useCreateGroupMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: CreateGroupPayload) => createGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: servicesKeys.groups() });
      toast.showToast('Group created successfully', 'success');
    },
    onError: (err: ApiError) => {
      toast.showToast(err.error?.message || 'Failed to create group', 'error');
    },
  });
}

export function useUpdateGroupMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGroupPayload }) =>
      updateGroup(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: servicesKeys.groups() });
      queryClient.invalidateQueries({ queryKey: servicesKeys.lists() });
      toast.showToast('Group updated successfully', 'success');
    },
    onError: (err: ApiError) => {
      toast.showToast(err.error?.message || 'Failed to update group', 'error');
    },
  });
}

export function useDeleteGroupMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: servicesKeys.groups() });
      queryClient.invalidateQueries({ queryKey: servicesKeys.lists() });
      toast.showToast('Group deleted successfully', 'success');
    },
    onError: (err: ApiError) => {
      toast.showToast(err.error?.message || 'Failed to delete group', 'error');
    },
  });
}

export function useHealthCheckHistoryQuery(
  serviceId: string,
  filters?: { page?: number; limit?: number },
  enabled = true
) {
  return useQuery({
    queryKey: servicesKeys.healthChecks(serviceId, filters),
    queryFn: () => getHealthChecks(serviceId, filters),
    enabled: !!serviceId && enabled,
  });
}

export function usePauseServiceMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => pauseService(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: servicesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: servicesKeys.detail(id) });
      toast.showToast('Service paused', 'success');
    },
    onError: (err: ApiError) => {
      toast.showToast(err.error?.message || 'Failed to pause service', 'error');
    },
  });
}

export function useResumeServiceMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => resumeService(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: servicesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: servicesKeys.detail(id) });
      toast.showToast('Service resumed', 'success');
    },
    onError: (err: ApiError) => {
      toast.showToast(err.error?.message || 'Failed to resume service', 'error');
    },
  });
}

export function useCheckNowMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => checkNow(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: servicesKeys.lists() });
      queryClient.invalidateQueries({ queryKey: servicesKeys.detail(id) });
      toast.showToast('Health check enqueued', 'success');
    },
    onError: (err: ApiError) => {
      toast.showToast(err.error?.message || 'Failed to trigger health check', 'error');
    },
  });
}

export function useBulkPauseMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (ids: string[]) => bulkPause(ids),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: servicesKeys.lists() });
      toast.showToast(`Paused ${res.data?.count ?? 'selected'} services`, 'success');
    },
    onError: (err: ApiError) => {
      toast.showToast(err.error?.message || 'Failed to bulk pause services', 'error');
    },
  });
}

export function useBulkResumeMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (ids: string[]) => bulkResume(ids),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: servicesKeys.lists() });
      toast.showToast(`Resumed ${res.data?.count ?? 'selected'} services`, 'success');
    },
    onError: (err: ApiError) => {
      toast.showToast(err.error?.message || 'Failed to bulk resume services', 'error');
    },
  });
}

export function useBulkIntervalMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ ids, interval }: { ids: string[]; interval: number }) =>
      bulkInterval(ids, interval),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: servicesKeys.lists() });
      toast.showToast(`Updated check interval for ${res.data?.count ?? 'selected'} services`, 'success');
    },
    onError: (err: ApiError) => {
      toast.showToast(err.error?.message || 'Failed to update check interval', 'error');
    },
  });
}

export function useBulkGroupMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ ids, groupId }: { ids: string[]; groupId: string | null }) =>
      bulkGroup(ids, groupId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: servicesKeys.lists() });
      toast.showToast(`Updated group for ${res.data?.count ?? 'selected'} services`, 'success');
    },
    onError: (err: ApiError) => {
      toast.showToast(err.error?.message || 'Failed to update group', 'error');
    },
  });
}

export function useBulkDeleteMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (ids: string[]) => bulkDelete(ids),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: servicesKeys.lists() });
      toast.showToast(`Deleted ${res.data?.count ?? 'selected'} services`, 'success');
    },
    onError: (err: ApiError) => {
      toast.showToast(err.error?.message || 'Failed to delete services', 'error');
    },
  });
}

