import ReleaseRepository from '../repositories/release.repository.js';
import ProjectRepository from '../repositories/project.repository.js';
import AppError from '../utils/AppError.js';

class ReleaseService {
  /**
   * Ingest and record a release from CI or SDK
   */
  static async recordRelease({ projectId, version, commitSha, deployedAt, environment }) {
    if (!projectId) {
      throw new AppError('Project ID is required', 400, 'BAD_REQUEST');
    }
    if (!version) {
      throw new AppError('Release version is required', 400, 'BAD_REQUEST');
    }

    return ReleaseRepository.upsert({
      projectId,
      version,
      commitSha,
      deployedAt,
      environment: environment || 'production',
    });
  }

  /**
   * Get releases for a project belonging to the caller's organization
   */
  static async getReleases(projectId, organizationId, options = {}) {
    const project = await ProjectRepository.findByIdAndOrg(projectId, organizationId);
    if (!project) {
      throw new AppError('Project not found', 404, 'NOT_FOUND');
    }

    return ReleaseRepository.findByProjectId(projectId, options);
  }
}

export default ReleaseService;
