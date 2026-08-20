import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { maintenanceKeys } from '../../../lib/queryKeys';
import { useToast } from '../../../app/providers/ToastProvider';
import {
  listMaintenance,
  getMaintenance,
  createMaintenance,
  updateMaintenance,
  deleteMaintenance,
} from '../../../api/maintenance';
import type {
  MaintenanceQueryParams,
  CreateMaintenancePayload,
  UpdateMaintenancePayload,
} from '../types/maintenance';
import type { ApiError } from '../../../types/api';

export function useMaintenanceQuery(filters?: MaintenanceQueryParams) {
  return useQuery({
    queryKey: maintenanceKeys.list(filters),
    queryFn: () => listMaintenance(filters),
  });
}

export function useMaintenanceDetailQuery(id: string) {
  return useQuery({
    queryKey: maintenanceKeys.detail(id),
    queryFn: () => getMaintenance(id),
    enabled: !!id,
  });
}

export function useCreateMaintenanceMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: CreateMaintenancePayload) => createMaintenance(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.lists() });
      toast.showToast('Maintenance window scheduled successfully', 'success');
    },
    onError: (err: ApiError) => {
      toast.showToast(err.error?.message || 'Failed to schedule maintenance window', 'error');
    },
  });
}

export function useUpdateMaintenanceMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMaintenancePayload }) =>
      updateMaintenance(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.detail(id) });
      toast.showToast('Maintenance window updated successfully', 'success');
    },
    onError: (err: ApiError) => {
      toast.showToast(err.error?.message || 'Failed to update maintenance window', 'error');
    },
  });
}

export function useDeleteMaintenanceMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteMaintenance(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.detail(id) });
      toast.showToast('Maintenance window removed successfully', 'success');
    },
    onError: (err: ApiError) => {
      toast.showToast(err.error?.message || 'Failed to remove maintenance window', 'error');
    },
  });
}
