import StatusPageService from '../services/statusPageService.js';
import AuditService from '../services/auditService.js';
import ApiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

const getSettings = asyncHandler(async (req, res) => {
  const settings = await StatusPageService.getSettings(req.user.organizationId);
  return ApiResponse.success(res, { settings });
});

const updateSettings = asyncHandler(async (req, res) => {
  const settings = await StatusPageService.updateSettings(req.user.organizationId, req.body);
  await AuditService.record(
    req.user.organizationId,
    req.user.id,
    'status_page_settings.updated',
    'StatusPageSettings',
    settings.id,
    { updates: req.body }
  );
  return ApiResponse.success(res, { settings });
});

export { getSettings, updateSettings };
export default { getSettings, updateSettings };
