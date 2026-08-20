import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationsKeys } from '../../../../lib/queryKeys';
import { useToast } from '../../../../app/providers/ToastProvider';
import {
  getOrganization,
  listMembers,
  inviteMember,
  updateMemberRole,
  removeMember,
} from '../../../../api/organizations';
import type { ApiError } from '../../../../types/api';

export function useOrganizationQuery() {
  return useQuery({
    queryKey: organizationsKeys.current(),
    queryFn: () => getOrganization(),
  });
}

export function useMembersQuery(filters?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: organizationsKeys.members(filters),
    queryFn: () => listMembers(filters),
  });
}

export function useInviteMemberMutation() {
  const toast = useToast();

  return useMutation({
    mutationFn: (data: { email: string; role: 'admin' | 'viewer' }) => inviteMember(data),
    onSuccess: () => {
      toast.showToast('Invitation sent successfully', 'success');
    },
    onError: (err: ApiError) => {
      toast.showToast(err.error?.message || 'Failed to send invitation', 'error');
    },
  });
}

export function useUpdateMemberRoleMutation(filters?: { page?: number; limit?: number }) {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: 'admin' | 'viewer' }) =>
      updateMemberRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationsKeys.members(filters) });
      toast.showToast('Member role updated successfully', 'success');
    },
    onError: (err: ApiError) => {
      toast.showToast(err.error?.message || 'Failed to update member role', 'error');
    },
  });
}

export function useRemoveMemberMutation(filters?: { page?: number; limit?: number }) {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (userId: string) => removeMember(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: organizationsKeys.members(filters) });
      toast.showToast('Member removed successfully', 'success');
    },
    onError: (err: ApiError) => {
      toast.showToast(err.error?.message || 'Failed to remove member', 'error');
    },
  });
}
