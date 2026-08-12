import StatusPageService from '../services/statusPageService.js';
import ApiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

const getStatusPage = asyncHandler(async (req, res) => {
  const data = await StatusPageService.getStatusPage(req.params.orgSlug);
  return ApiResponse.success(res, data);
});

const getStatusPageIncidents = asyncHandler(async (req, res) => {
  const incidents = await StatusPageService.getStatusPageIncidents(req.params.orgSlug);
  return ApiResponse.success(res, { incidents });
});

const getStatusPageMaintenance = asyncHandler(async (req, res) => {
  const maintenance = await StatusPageService.getStatusPageMaintenance(req.params.orgSlug);
  return ApiResponse.success(res, { maintenance });
});

export { getStatusPage, getStatusPageIncidents, getStatusPageMaintenance };
export default { getStatusPage, getStatusPageIncidents, getStatusPageMaintenance };
