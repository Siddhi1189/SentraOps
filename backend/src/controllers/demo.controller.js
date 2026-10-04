import DemoService from '../services/demoService.js';
import ApiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

const seedDemo = asyncHandler(async (req, res) => {
  const result = await DemoService.seedDemoData(req.user.organizationId);
  return ApiResponse.success(res, result, 201);
});

const removeDemo = asyncHandler(async (req, res) => {
  const result = await DemoService.removeDemoData(req.user.organizationId);
  return ApiResponse.success(res, result, 200);
});

export {
  seedDemo,
  removeDemo,
};

export default {
  seedDemo,
  removeDemo,
};
