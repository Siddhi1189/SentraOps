import EscalationService from '../services/escalationService.js';
import AuditService from '../services/auditService.js';
import ApiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

const list = asyncHandler(async (req, res) => {
  const policies = await EscalationService.list(req.user.organizationId);
  return ApiResponse.success(res, { policies });
});

const get = asyncHandler(async (req, res) => {
  const policy = await EscalationService.get(req.user.organizationId, req.params.id);
  return ApiResponse.success(res, { policy });
});

const upsert = asyncHandler(async (req, res) => {
  const policy = await EscalationService.upsert(req.user.organizationId, req.body);
  await AuditService.record(
    req.user.organizationId, req.user.id, 'escalation_policy.upserted', 'EscalationPolicy', policy.id
  );
  return ApiResponse.success(res, { policy }, 200);
});

const remove = asyncHandler(async (req, res) => {
  await EscalationService.remove(req.user.organizationId, req.params.id);
  await AuditService.record(
    req.user.organizationId, req.user.id, 'escalation_policy.deleted', 'EscalationPolicy', req.params.id
  );
  return ApiResponse.success(res, { message: 'Escalation policy deleted' });
});

export { list, get, upsert, remove };
export default { list, get, upsert, remove };
