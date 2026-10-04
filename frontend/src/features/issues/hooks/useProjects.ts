import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsKeys } from '../../../lib/queryKeys';
import { useToast } from '../../../app/providers/ToastProvider';
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  listApiKeys,
  createApiKey,
  revokeApiKey,
} from '../../../api/projects';
import type { ApiError } from '../../../types/api';

export function useProjectsQuery() {
  return useQuery({
    queryKey: projectsKeys.lists(),
    queryFn: () => listProjects(),
  });
}

export function useProjectQuery(id: string) {
  return useQuery({
    queryKey: projectsKeys.detail(id),
    queryFn: () => getProject(id),
    enabled: !!id,
  });
}

export function useProjectKeysQuery(projectId: string) {
  return useQuery({
    queryKey: projectsKeys.keys(projectId),
    queryFn: () => listApiKeys(projectId),
    enabled: !!projectId,
  });
}

export function useCreateProjectMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (data: { name: string; platform?: string; environmentDefault?: string }) =>
      createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectsKeys.all });
      toast.showToast('Project created successfully', 'success');
    },
    onError: (err: ApiError) => {
      toast.showToast(err.error?.message || 'Failed to create project', 'error');
    },
  });
}

export function useUpdateProjectMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; platform?: string } }) =>
      updateProject(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: projectsKeys.all });
      queryClient.invalidateQueries({ queryKey: projectsKeys.detail(id) });
      toast.showToast('Project updated successfully', 'success');
    },
    onError: (err: ApiError) => {
      toast.showToast(err.error?.message || 'Failed to update project', 'error');
    },
  });
}

export function useDeleteProjectMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectsKeys.all });
      toast.showToast('Project deleted successfully', 'success');
    },
    onError: (err: ApiError) => {
      toast.showToast(err.error?.message || 'Failed to delete project', 'error');
    },
  });
}

export function useCreateApiKeyMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ projectId, data }: { projectId: string; data: { name?: string } }) =>
      createApiKey(projectId, data),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: projectsKeys.keys(projectId) });
      toast.showToast('API key generated successfully', 'success');
    },
    onError: (err: ApiError) => {
      toast.showToast(err.error?.message || 'Failed to generate API key', 'error');
    },
  });
}

export function useRevokeApiKeyMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  return useMutation({
    mutationFn: ({ projectId, keyId }: { projectId: string; keyId: string }) =>
      revokeApiKey(projectId, keyId),
    onSuccess: (_, { projectId }) => {
      queryClient.invalidateQueries({ queryKey: projectsKeys.keys(projectId) });
      toast.showToast('API key revoked', 'info');
    },
    onError: (err: ApiError) => {
      toast.showToast(err.error?.message || 'Failed to revoke API key', 'error');
    },
  });
}
