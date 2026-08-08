import IncidentService from '../services/incidentService.js';
import AuditService from '../services/auditService.js';
import ApiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

const listIncidents = asyncHandler(async (req, res) => {
  const { incidents, total } = await IncidentService.listIncidents(req.user.organizationId, req.query);
  return ApiResponse.success(res, { incidents }, 200, { total, page: +req.query.page || 1 });
});

const getIncident = asyncHandler(async (req, res) => {
  const incident = await IncidentService.getIncident(req.user.organizationId, req.params.id);
  return ApiResponse.success(res, { incident });
});

const updateIncident = asyncHandler(async (req, res) => {
  const { updatedAt, ...updates } = req.body;
  const incident = await IncidentService.updateIncident(
    req.user.organizationId, req.params.id, updates, req.user.id, updatedAt
  );
  await AuditService.record(
    req.user.organizationId, req.user.id, 'incident.updated', 'Incident', incident.id,
    { updates }
  );
  return ApiResponse.success(res, { incident });
});

const getTimeline = asyncHandler(async (req, res) => {
  const events = await IncidentService.getTimeline(req.user.organizationId, req.params.id);
  return ApiResponse.success(res, { events });
});

export { listIncidents, getIncident, updateIncident, getTimeline };
export default { listIncidents, getIncident, updateIncident, getTimeline };
