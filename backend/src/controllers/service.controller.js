import MonitoringService from '../services/monitoringService.js';
import AuditService from '../services/auditService.js';
import ApiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import { computeFieldDiff } from '../utils/diff.js';

// ─── Service Groups ──────────────────────────────────────────────────────────

const createGroup = asyncHandler(async (req, res) => {
  const group = await MonitoringService.createGroup(req.user.organizationId, req.body);
  await AuditService.record(req.user.organizationId, req.user.id, 'service_group.created', 'ServiceGroup', group.id, { name: group.name });
  return ApiResponse.success(res, { group }, 201);
});

const listGroups = asyncHandler(async (req, res) => {
  const groups = await MonitoringService.listGroups(req.user.organizationId);
  return ApiResponse.success(res, { groups });
});

const getGroup = asyncHandler(async (req, res) => {
  const group = await MonitoringService.getGroup(req.user.organizationId, req.params.id);
  return ApiResponse.success(res, { group });
});

const updateGroup = asyncHandler(async (req, res) => {
  const group = await MonitoringService.updateGroup(req.user.organizationId, req.params.id, req.body);
  await AuditService.record(req.user.organizationId, req.user.id, 'service_group.updated', 'ServiceGroup', group.id);
  return ApiResponse.success(res, { group });
});

const deleteGroup = asyncHandler(async (req, res) => {
  await MonitoringService.deleteGroup(req.user.organizationId, req.params.id);
  await AuditService.record(req.user.organizationId, req.user.id, 'service_group.deleted', 'ServiceGroup', req.params.id);
  return ApiResponse.success(res, { message: 'Service group deleted' });
});

// ─── Services ────────────────────────────────────────────────────────────────

const createService = asyncHandler(async (req, res) => {
  const { tags, ...data } = req.body;
  const service = await MonitoringService.createService(req.user.organizationId, data, tags);
  await AuditService.record(req.user.organizationId, req.user.id, 'service.created', 'Service', service.id, { name: service.name, url: service.url });
  return ApiResponse.success(res, { service }, 201);
});

const listServices = asyncHandler(async (req, res) => {
  const { services, total } = await MonitoringService.listServices(req.user.organizationId, req.query);
  return ApiResponse.success(res, { services }, 200, { total, page: +req.query.page || 1 });
});

const getService = asyncHandler(async (req, res) => {
  const service = await MonitoringService.getService(req.user.organizationId, req.params.id);
  return ApiResponse.success(res, { service });
});

const updateService = asyncHandler(async (req, res) => {
  const { tags, updatedAt, ...data } = req.body;
  const existing = await MonitoringService.getService(req.user.organizationId, req.params.id);
  const service = await MonitoringService.updateService(
    req.user.organizationId, req.params.id, data, tags, updatedAt
  );
  const diff = computeFieldDiff(existing, service);
  await AuditService.record(req.user.organizationId, req.user.id, 'service.updated', 'Service', service.id, { diff });
  return ApiResponse.success(res, { service });
});

const deleteService = asyncHandler(async (req, res) => {
  await MonitoringService.deleteService(req.user.organizationId, req.params.id);
  await AuditService.record(req.user.organizationId, req.user.id, 'service.deleted', 'Service', req.params.id);
  return ApiResponse.success(res, { message: 'Service deleted' });
});

// ─── 3.2 Management Actions ──────────────────────────────────────────────────

const pauseService = asyncHandler(async (req, res) => {
  const service = await MonitoringService.pauseService(req.user.organizationId, req.params.id);
  await AuditService.record(req.user.organizationId, req.user.id, 'service.paused', 'Service', service.id);
  return ApiResponse.success(res, { service, message: 'Service paused successfully' });
});

const resumeService = asyncHandler(async (req, res) => {
  const service = await MonitoringService.resumeService(req.user.organizationId, req.params.id);
  await AuditService.record(req.user.organizationId, req.user.id, 'service.resumed', 'Service', service.id);
  return ApiResponse.success(res, { service, message: 'Service resumed successfully' });
});

const checkNow = asyncHandler(async (req, res) => {
  const result = await MonitoringService.checkNow(req.user.organizationId, req.params.id);
  return ApiResponse.success(res, result);
});

// ─── 3.2 Bulk Actions ────────────────────────────────────────────────────────

const bulkPause = asyncHandler(async (req, res) => {
  const { serviceIds } = req.body;
  const result = await MonitoringService.bulkPause(req.user.organizationId, serviceIds);
  await AuditService.record(req.user.organizationId, req.user.id, 'services.bulk_paused', 'Service', null, { count: result.count, serviceIds });
  return ApiResponse.success(res, { count: result.count, message: `${result.count} services paused` });
});

const bulkResume = asyncHandler(async (req, res) => {
  const { serviceIds } = req.body;
  const result = await MonitoringService.bulkResume(req.user.organizationId, serviceIds);
  await AuditService.record(req.user.organizationId, req.user.id, 'services.bulk_resumed', 'Service', null, { count: result.count, serviceIds });
  return ApiResponse.success(res, { count: result.count, message: `${result.count} services resumed` });
});

const bulkInterval = asyncHandler(async (req, res) => {
  const { serviceIds, checkIntervalSeconds } = req.body;
  const result = await MonitoringService.bulkChangeInterval(req.user.organizationId, serviceIds, checkIntervalSeconds);
  await AuditService.record(req.user.organizationId, req.user.id, 'services.bulk_interval_changed', 'Service', null, { count: result.count, checkIntervalSeconds, serviceIds });
  return ApiResponse.success(res, { count: result.count, message: `Check interval updated for ${result.count} services` });
});

const bulkGroup = asyncHandler(async (req, res) => {
  const { serviceIds, groupId } = req.body;
  const result = await MonitoringService.bulkChangeGroup(req.user.organizationId, serviceIds, groupId);
  await AuditService.record(req.user.organizationId, req.user.id, 'services.bulk_group_changed', 'Service', null, { count: result.count, groupId, serviceIds });
  return ApiResponse.success(res, { count: result.count, message: `Group updated for ${result.count} services` });
});

const bulkDelete = asyncHandler(async (req, res) => {
  const { serviceIds } = req.body;
  const result = await MonitoringService.bulkDelete(req.user.organizationId, serviceIds);
  await AuditService.record(req.user.organizationId, req.user.id, 'services.bulk_deleted', 'Service', null, { count: result.count, serviceIds });
  return ApiResponse.success(res, { count: result.count, message: `${result.count} services deleted` });
});

export {
  createGroup,
  listGroups,
  getGroup,
  updateGroup,
  deleteGroup,
  createService,
  listServices,
  getService,
  updateService,
  deleteService,
  pauseService,
  resumeService,
  checkNow,
  bulkPause,
  bulkResume,
  bulkInterval,
  bulkGroup,
  bulkDelete,
};
export default {
  createGroup,
  listGroups,
  getGroup,
  updateGroup,
  deleteGroup,
  createService,
  listServices,
  getService,
  updateService,
  deleteService,
  pauseService,
  resumeService,
  checkNow,
  bulkPause,
  bulkResume,
  bulkInterval,
  bulkGroup,
  bulkDelete,
};
