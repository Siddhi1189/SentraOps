import OrganizationService from '../services/organizationService.js';
import AuditService from '../services/auditService.js';
import ApiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

const getOrganization = asyncHandler(async (req, res) => {
  const org = await OrganizationService.getOrganization(req.user.organizationId);
  return ApiResponse.success(res, { organization: org });
});

const invite = asyncHandler(async (req, res) => {
  const { user: invited } = await OrganizationService.inviteMember(
    req.user.organizationId,
    req.body,
    req.user.role
  );
  await AuditService.record(
    req.user.organizationId, req.user.id, 'member.invited', 'User', invited.id,
    { email: invited.email, role: invited.role }
  );
  return ApiResponse.success(res, { user: sanitizeUser(invited) }, 201);
});

const listMembers = asyncHandler(async (req, res) => {
  const { users, total } = await OrganizationService.listMembers(req.user.organizationId, req.query);
  return ApiResponse.success(res, { members: users }, 200, { total, page: +req.query.page || 1 });
});

const updateMemberRole = asyncHandler(async (req, res) => {
  const updated = await OrganizationService.updateMemberRole(
    req.user.organizationId, req.params.userId, req.body.role, req.user.role
  );
  await AuditService.record(
    req.user.organizationId, req.user.id, 'member.role_changed', 'User', updated.id,
    { newRole: updated.role }
  );
  return ApiResponse.success(res, { user: sanitizeUser(updated) });
});

const removeMember = asyncHandler(async (req, res) => {
  await OrganizationService.removeMember(
    req.user.organizationId, req.params.userId, req.user.role, req.user.id
  );
  await AuditService.record(
    req.user.organizationId, req.user.id, 'member.removed', 'User', req.params.userId
  );
  return ApiResponse.success(res, { message: 'Member removed successfully' });
});

function sanitizeUser(user) {
  const { passwordHash, ...safe } = user;
  return safe;
}

export { getOrganization, invite, listMembers, updateMemberRole, removeMember };
export default { getOrganization, invite, listMembers, updateMemberRole, removeMember };
