import ProjectService from '../services/projectService.js';
import ApiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

export const createProject = asyncHandler(async (req, res) => {
  const project = await ProjectService.createProject(req.user.organizationId, req.user.id, req.body);
  return ApiResponse.success(res, { project }, 201);
});

export const listProjects = asyncHandler(async (req, res) => {
  const projects = await ProjectService.listProjects(req.user.organizationId);
  return ApiResponse.success(res, { projects });
});

export const getProject = asyncHandler(async (req, res) => {
  const project = await ProjectService.getProject(req.user.organizationId, req.params.id);
  return ApiResponse.success(res, { project });
});

export const updateProject = asyncHandler(async (req, res) => {
  const project = await ProjectService.updateProject(req.user.organizationId, req.user.id, req.params.id, req.body);
  return ApiResponse.success(res, { project });
});

export const deleteProject = asyncHandler(async (req, res) => {
  await ProjectService.deleteProject(req.user.organizationId, req.user.id, req.params.id);
  return ApiResponse.success(res, { message: 'Project deleted' });
});

export const createApiKey = asyncHandler(async (req, res) => {
  const apiKey = await ProjectService.createApiKey(req.user.organizationId, req.user.id, req.params.id, req.body);
  return ApiResponse.success(res, { apiKey }, 201);
});

export const listApiKeys = asyncHandler(async (req, res) => {
  const apiKeys = await ProjectService.listApiKeys(req.user.organizationId, req.params.id);
  return ApiResponse.success(res, { apiKeys });
});

export const revokeApiKey = asyncHandler(async (req, res) => {
  const apiKey = await ProjectService.revokeApiKey(req.user.organizationId, req.user.id, req.params.id, req.params.keyId);
  return ApiResponse.success(res, { apiKey, message: 'API key revoked' });
});

export default {
  createProject,
  listProjects,
  getProject,
  updateProject,
  deleteProject,
  createApiKey,
  listApiKeys,
  revokeApiKey,
};
