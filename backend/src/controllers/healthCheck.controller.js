import HealthCheckRepository from '../repositories/healthCheck.repository.js';
import ApiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { z } from 'zod';

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
});

const getHealthChecksForService = asyncHandler(async (req, res) => {
  const { page, limit } = querySchema.parse(req.query);
  const { healthChecks, total } = await HealthCheckRepository.findManyByService(
    req.params.serviceId,
    req.user.organizationId,
    { page, limit }
  );
  return ApiResponse.success(res, { healthChecks }, 200, { total, page, limit });
});

export { getHealthChecksForService };
export default { getHealthChecksForService };
