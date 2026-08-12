import AuditService from '../services/auditService.js';
import ApiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { z } from 'zod';

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  entityType: z.string().optional(),
  userId: z.string().uuid().optional(),
});

const getLogs = asyncHandler(async (req, res) => {
  const query = querySchema.parse(req.query);
  const { auditLogs, total } = await AuditService.getLogs(req.user.organizationId, query);
  return ApiResponse.success(res, { auditLogs }, 200, { total, page: query.page });
});

export { getLogs };
export default { getLogs };
