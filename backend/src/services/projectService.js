import crypto from 'crypto';
import ProjectRepository from '../repositories/project.repository.js';
import ApiKeyRepository from '../repositories/apiKey.repository.js';
import AuditService from './auditService.js';
import AppError from '../utils/appError.js';

class ProjectService {
  /**
   * Create a new project, enforcing max 5 projects per organization
   */
  static async createProject(organizationId, userId, data) {
    const count = await ProjectRepository.countByOrg(organizationId);
    if (count >= 5) {
      throw new AppError('Project quota limit of 5 projects reached for this organization', 400, 'PROJECT_QUOTA_EXCEEDED');
    }

    const project = await ProjectRepository.create({
      organizationId,
      name: data.name,
      platform: data.platform || 'node',
      environmentDefault: data.environmentDefault || 'production',
    });

    await AuditService.record(organizationId, userId, 'project.created', 'project', project.id, {
      name: project.name,
      platform: project.platform,
    });

    return project;
  }

  /**
   * List all projects for an organization
   */
  static async listProjects(organizationId) {
    return ProjectRepository.findManyByOrg(organizationId);
  }

  /**
   * Get a single project
   */
  static async getProject(organizationId, id) {
    const project = await ProjectRepository.findByIdAndOrg(id, organizationId);
    if (!project) {
      throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
    }
    return project;
  }

  /**
   * Update a project
   */
  static async updateProject(organizationId, userId, id, data) {
    const existing = await ProjectRepository.findByIdAndOrg(id, organizationId);
    if (!existing) {
      throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
    }

    const updated = await ProjectRepository.update(id, organizationId, {
      ...(data.name ? { name: data.name } : {}),
      ...(data.platform ? { platform: data.platform } : {}),
      ...(data.environmentDefault ? { environmentDefault: data.environmentDefault } : {}),
    });

    await AuditService.record(organizationId, userId, 'project.updated', 'project', id, data);
    return updated;
  }

  /**
   * Delete a project
   */
  static async deleteProject(organizationId, userId, id) {
    const existing = await ProjectRepository.findByIdAndOrg(id, organizationId);
    if (!existing) {
      throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
    }

    await ProjectRepository.delete(id);
    await AuditService.record(organizationId, userId, 'project.deleted', 'project', id, {
      name: existing.name,
    });

    return { id };
  }

  /**
   * Create an API key for a project. Returns the plaintext key ONCE.
   */
  static async createApiKey(organizationId, userId, projectId, { name }) {
    const project = await ProjectRepository.findByIdAndOrg(projectId, organizationId);
    if (!project) {
      throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
    }

    // Key format: sops_<32 random url-safe chars>
    const randomChars = crypto.randomBytes(24).toString('base64url'); // 32 url-safe chars
    const fullKey = `sops_${randomChars}`;
    const keyPrefix = fullKey.substring(0, 8);
    const keyHash = crypto.createHash('sha256').update(fullKey).digest('hex');

    const apiKey = await ApiKeyRepository.create({
      projectId,
      name: name || 'Default Key',
      keyPrefix,
      keyHash,
    });

    await AuditService.record(organizationId, userId, 'api_key.created', 'api_key', apiKey.id, {
      projectId,
      name: apiKey.name,
      keyPrefix,
    });

    return {
      id: apiKey.id,
      projectId: apiKey.projectId,
      name: apiKey.name,
      keyPrefix: apiKey.keyPrefix,
      key: fullKey, // Revealed ONCE
      createdAt: apiKey.createdAt,
    };
  }

  /**
   * List API keys for a project (prefix only)
   */
  static async listApiKeys(organizationId, projectId) {
    const project = await ProjectRepository.findByIdAndOrg(projectId, organizationId);
    if (!project) {
      throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
    }

    return ApiKeyRepository.findManyByProject(projectId);
  }

  /**
   * Revoke an API key
   */
  static async revokeApiKey(organizationId, userId, projectId, keyId) {
    const project = await ProjectRepository.findByIdAndOrg(projectId, organizationId);
    if (!project) {
      throw new AppError('Project not found', 404, 'PROJECT_NOT_FOUND');
    }

    const key = await ApiKeyRepository.findByIdAndProject(keyId, projectId);
    if (!key) {
      throw new AppError('API key not found', 404, 'API_KEY_NOT_FOUND');
    }

    const revoked = await ApiKeyRepository.revoke(keyId);

    await AuditService.record(organizationId, userId, 'api_key.revoked', 'api_key', keyId, {
      projectId,
      keyPrefix: key.keyPrefix,
    });

    return revoked;
  }
}

export default ProjectService;
