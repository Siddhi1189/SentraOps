import { apiRequest } from './client';
import type { ApiSuccess } from '../types/api';
import type { Project, ApiKey } from '../features/issues/types/issues';

export async function listProjects(): Promise<ApiSuccess<Project[]>> {
  const response = await apiRequest<{ projects: Project[] }>('/projects', { method: 'GET' });
  const projects = Array.isArray(response.data)
    ? response.data
    : response.data?.projects || [];
  return {
    ...response,
    data: projects,
  };
}

export async function getProject(id: string): Promise<ApiSuccess<Project>> {
  const response = await apiRequest<{ project: Project }>(`/projects/${id}`, { method: 'GET' });
  const project = response.data?.project || (response.data as unknown as Project);
  return {
    ...response,
    data: project,
  };
}

export async function createProject(data: {
  name: string;
  platform?: string;
  environmentDefault?: string;
}): Promise<ApiSuccess<Project>> {
  const response = await apiRequest<{ project: Project }>('/projects', {
    method: 'POST',
    body: data,
  });
  const project = response.data?.project || (response.data as unknown as Project);
  return {
    ...response,
    data: project,
  };
}

export async function updateProject(
  id: string,
  data: { name?: string; platform?: string; environmentDefault?: string }
): Promise<ApiSuccess<Project>> {
  const response = await apiRequest<{ project: Project }>(`/projects/${id}`, {
    method: 'PATCH',
    body: data,
  });
  const project = response.data?.project || (response.data as unknown as Project);
  return {
    ...response,
    data: project,
  };
}

export async function deleteProject(id: string): Promise<ApiSuccess<{ id: string }>> {
  return apiRequest<{ id: string }>(`/projects/${id}`, { method: 'DELETE' });
}

export async function listApiKeys(projectId: string): Promise<ApiSuccess<ApiKey[]>> {
  const response = await apiRequest<{ keys: ApiKey[] }>(`/projects/${projectId}/keys`, {
    method: 'GET',
  });
  const keys = Array.isArray(response.data) ? response.data : response.data?.keys || [];
  return {
    ...response,
    data: keys,
  };
}

export async function createApiKey(
  projectId: string,
  data: { name?: string }
): Promise<ApiSuccess<ApiKey>> {
  const response = await apiRequest<{ key: ApiKey }>(`/projects/${projectId}/keys`, {
    method: 'POST',
    body: data,
  });
  const key = response.data?.key || (response.data as unknown as ApiKey);
  return {
    ...response,
    data: key,
  };
}

export async function revokeApiKey(
  projectId: string,
  keyId: string
): Promise<ApiSuccess<ApiKey>> {
  const response = await apiRequest<{ key: ApiKey }>(
    `/projects/${projectId}/keys/${keyId}`,
    { method: 'DELETE' }
  );
  const key = response.data?.key || (response.data as unknown as ApiKey);
  return {
    ...response,
    data: key,
  };
}
