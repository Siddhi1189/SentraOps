import AnalyticsService from '../services/analyticsService.js';
import ApiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

const getServiceAnalytics = asyncHandler(async (req, res) => {
  const data = await AnalyticsService.getServiceAnalytics(req.params.id, req.user.organizationId);
  return ApiResponse.success(res, data);
});

const getIncidentAnalytics = asyncHandler(async (req, res) => {
  const data = await AnalyticsService.getIncidentAnalytics(req.user.organizationId, req.query);
  return ApiResponse.success(res, data);
});

export { getServiceAnalytics, getIncidentAnalytics };
export default { getServiceAnalytics, getIncidentAnalytics };
