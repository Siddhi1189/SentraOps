import MaintenanceService from '../services/maintenanceService.js';
import AuditService from '../services/auditService.js';
import ApiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

const list = asyncHandler(async (req, res) => {
  const { maintenanceWindows, total } = await MaintenanceService.list(req.user.organizationId, req.query);
  return ApiResponse.success(res, { maintenanceWindows }, 200, { total, page: +req.query.page || 1 });
});

const get = asyncHandler(async (req, res) => {
  const window = await MaintenanceService.get(req.user.organizationId, req.params.id);
  return ApiResponse.success(res, { maintenanceWindow: window });
});

const create = asyncHandler(async (req, res) => {
  const window = await MaintenanceService.create(req.user.organizationId, req.body);
  await AuditService.record(
    req.user.organizationId, req.user.id, 'maintenance.created', 'MaintenanceWindow', window.id,
    { title: window.title }
  );
  return ApiResponse.success(res, { maintenanceWindow: window }, 201);
});

const update = asyncHandler(async (req, res) => {
  const window = await MaintenanceService.update(req.user.organizationId, req.params.id, req.body);
  await AuditService.record(
    req.user.organizationId, req.user.id, 'maintenance.updated', 'MaintenanceWindow', window.id
  );
  return ApiResponse.success(res, { maintenanceWindow: window });
});

const remove = asyncHandler(async (req, res) => {
  await MaintenanceService.remove(req.user.organizationId, req.params.id);
  await AuditService.record(
    req.user.organizationId, req.user.id, 'maintenance.deleted', 'MaintenanceWindow', req.params.id
  );
  return ApiResponse.success(res, { message: 'Maintenance window deleted' });
});

export { list, get, create, update, remove };
export default { list, get, create, update, remove };
