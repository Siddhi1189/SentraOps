import IssueService from '../services/issueService.js';
import ApiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

export const listIssues = asyncHandler(async (req, res) => {
  const result = await IssueService.listIssues(req.user.organizationId, req.query);
  return ApiResponse.success(res, { issues: result.issues }, 200, result.pagination);
});

export const getIssue = asyncHandler(async (req, res) => {
  const issue = await IssueService.getIssue(req.user.organizationId, req.params.id);
  return ApiResponse.success(res, { issue });
});

export const getIssueEvents = asyncHandler(async (req, res) => {
  const result = await IssueService.getIssueEvents(req.user.organizationId, req.params.id, req.query);
  return ApiResponse.success(res, { events: result.events }, 200, result.pagination);
});

export const updateIssue = asyncHandler(async (req, res) => {
  const { currentUpdatedAt, ...updates } = req.body;
  const issue = await IssueService.updateIssue(
    req.user.organizationId,
    req.user.id,
    req.params.id,
    updates,
    currentUpdatedAt
  );
  return ApiResponse.success(res, { issue });
});

export const createIncidentFromIssue = asyncHandler(async (req, res) => {
  const result = await IssueService.createIncidentFromIssue(
    req.user.organizationId,
    req.user.id,
    req.params.id,
    req.body
  );
  return ApiResponse.success(res, result, 201);
});

export default {
  listIssues,
  getIssue,
  getIssueEvents,
  updateIssue,
  createIncidentFromIssue,
};
