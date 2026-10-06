import ReleaseService from '../services/releaseService.js';
import ApiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

export const ingestRelease = asyncHandler(async (req, res) => {
  const { version, commitSha, environment, deployedAt } = req.body;
  const projectId = req.projectId;

  const release = await ReleaseService.recordRelease({
    projectId,
    version,
    commitSha,
    environment,
    deployedAt,
  });

  return ApiResponse.success(res, release, 201);
});

export const listProjectReleases = asyncHandler(async (req, res) => {
  const projectId = req.params.id;
  const organizationId = req.user.organizationId;
  const { environment, page = 1, limit = 50 } = req.query;

  const result = await ReleaseService.getReleases(projectId, organizationId, {
    environment,
    page: parseInt(page, 10),
    limit: parseInt(limit, 10),
  });

  return ApiResponse.success(res, result.releases, 200, {
    page: result.page,
    limit: result.limit,
    total: result.total,
  });
});

export default {
  ingestRelease,
  listProjectReleases,
};
