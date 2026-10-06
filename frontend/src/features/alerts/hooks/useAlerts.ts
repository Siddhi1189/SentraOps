import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertChannelsKeys, alertRulesKeys } from '../../../lib/queryKeys';
import { useToast } from '../../../app/providers/ToastProvider';
import {
  listAlertChannels,
  createAlertChannel,
  updateAlertChannel,
  deleteAlertChannel,
  testAlertChannel,
  listAlertRules,
  createAlertRule,
  updateAlertRule,
  deleteAlertRule,
  snoozeAlertRule,
  unsnoozeAlertRule,
} from '../../../api/alerts';
import type {
  CreateAlertChannelPayload,
  UpdateAlertChannelPayload,
  CreateAlertRulePayload,
  UpdateAlertRulePayload,
} from '../types/alerts';
import type { ApiError } from '../../../types/api';

// =====================
// Alert Channels Hooks
// =====================

export function useAlertChannelsQuery() {
  return useQuery({
    queryKey: alertChannelsKeys.lists(),
    queryFn: () => listAlertChannels(),
  });
}

export function useCreateAlertChannelMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: CreateAlertChannelPayload) => createAlertChannel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertChannelsKeys.all });
      toast.showToast('Notification channel created successfully', 'success');
    },
    onError: (err: ApiError) => {
      toast.showToast(err.error?.message || 'Failed to create notification channel', 'error');
    },
  });
}

export function useUpdateAlertChannelMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAlertChannelPayload }) =>
      updateAlertChannel(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertChannelsKeys.all });
      queryClient.invalidateQueries({ queryKey: alertRulesKeys.all });
      toast.showToast('Notification channel updated successfully', 'success');
    },
    onError: (err: ApiError) => {
      toast.showToast(err.error?.message || 'Failed to update notification channel', 'error');
    },
  });
}

export function useDeleteAlertChannelMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteAlertChannel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertChannelsKeys.all });
      queryClient.invalidateQueries({ queryKey: alertRulesKeys.all });
      toast.showToast('Notification channel deleted successfully', 'success');
    },
    onError: (err: ApiError) => {
      toast.showToast(err.error?.message || 'Failed to delete notification channel', 'error');
    },
  });
}

export function useTestAlertChannelMutation() {
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => testAlertChannel(id),
    onSuccess: (data) => {
      toast.showToast(data.message || 'Test alert sent successfully', 'success');
    },
    onError: (err: ApiError) => {
      toast.showToast(err.error?.message || 'Failed to send test alert', 'error');
    },
  });
}

// =====================
// Alert Rules Hooks
// =====================

export function useAlertRulesQuery() {
  return useQuery({
    queryKey: alertRulesKeys.lists(),
    queryFn: () => listAlertRules(),
  });
}

export function useCreateAlertRuleMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: CreateAlertRulePayload) => createAlertRule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertRulesKeys.all });
      toast.showToast('Alert rule created successfully', 'success');
    },
    onError: (err: ApiError) => {
      toast.showToast(err.error?.message || 'Failed to create alert rule', 'error');
    },
  });
}

export function useUpdateAlertRuleMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAlertRulePayload }) =>
      updateAlertRule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertRulesKeys.all });
      toast.showToast('Alert rule updated successfully', 'success');
    },
    onError: (err: ApiError) => {
      toast.showToast(err.error?.message || 'Failed to update alert rule', 'error');
    },
  });
}

export function useDeleteAlertRuleMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteAlertRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertRulesKeys.all });
      toast.showToast('Alert rule deleted successfully', 'success');
    },
    onError: (err: ApiError) => {
      toast.showToast(err.error?.message || 'Failed to delete alert rule', 'error');
    },
  });
}

export function useSnoozeAlertRuleMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, until }: { id: string; until: string }) => snoozeAlertRule(id, until),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertRulesKeys.all });
      toast.showToast('Alert rule snoozed successfully', 'success');
    },
    onError: (err: ApiError) => {
      toast.showToast(err.error?.message || 'Failed to snooze alert rule', 'error');
    },
  });
}

export function useUnsnoozeAlertRuleMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => unsnoozeAlertRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: alertRulesKeys.all });
      toast.showToast('Alert rule snooze removed', 'success');
    },
    onError: (err: ApiError) => {
      toast.showToast(err.error?.message || 'Failed to remove snooze', 'error');
    },
  });
}
