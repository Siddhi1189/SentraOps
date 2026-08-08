import UserRepository from '../repositories/user.repository.js';
import OrganizationRepository from '../repositories/organization.repository.js';
import { hashPassword } from '../utils/hashPassword.js';
import AppError from '../utils/AppError.js';

class OrganizationService {
  /**
   * Get organization details (restricted to caller's org)
   * @param {string} organizationId
   */
  static async getOrganization(organizationId) {
    const org = await OrganizationRepository.findById(organizationId);
    if (!org) {
      throw new AppError('Organization not found', 404, 'NOT_FOUND');
    }
    return org;
  }

  /**
   * Update organization settings
   * @param {string} organizationId
   * @param {Object} data
   */
  static async updateOrganization(organizationId, data) {
    const org = await OrganizationRepository.findById(organizationId);
    if (!org) {
      throw new AppError('Organization not found', 404, 'NOT_FOUND');
    }

    // If updating slug, verify uniqueness
    if (data.slug && data.slug !== org.slug) {
      const slugExists = await OrganizationRepository.findBySlug(data.slug);
      if (slugExists) {
        throw new AppError('This slug is already taken', 409, 'SLUG_TAKEN');
      }
    }

    return OrganizationRepository.update(organizationId, data);
  }

  /**
   * Invite a new member to the organization
   * @param {string} organizationId
   * @param {Object} inviteData
   * @param {string} inviteData.email
   * @param {string} inviteData.name
   * @param {string} inviteData.role
   * @param {string} inviterRole - Role of the person sending the invite
   */
  static async inviteMember(organizationId, { email, name, role }, inviterRole) {
    // Only owner/admin can invite; viewers cannot invite anyone
    if (inviterRole === 'viewer') {
      throw new AppError('Viewers cannot invite team members', 403, 'FORBIDDEN');
    }
    // Admin cannot create owners
    if (inviterRole === 'admin' && role === 'owner') {
      throw new AppError('Admins cannot assign the owner role', 403, 'FORBIDDEN');
    }

    const existing = await UserRepository.findByEmail(email);
    if (existing) {
      throw new AppError('A user with this email already exists', 409, 'EMAIL_TAKEN');
    }

    // Create user with a temporary password (they should reset via invite flow)
    const tempPassword = `Invite_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const passwordHash = await hashPassword(tempPassword);

    const user = await UserRepository.create(organizationId, {
      name,
      email,
      passwordHash,
      role,
    });

    // In production, send an invite email here
    return { user, tempPassword };
  }

  /**
   * List members in the caller's organization
   * @param {string} organizationId
   * @param {Object} query
   */
  static async listMembers(organizationId, query) {
    return UserRepository.findMany(organizationId, query);
  }

  /**
   * Update a member's role
   * @param {string} organizationId
   * @param {string} targetUserId
   * @param {string} newRole
   * @param {string} callerRole
   */
  static async updateMemberRole(organizationId, targetUserId, newRole, callerRole) {
    if (callerRole !== 'owner') {
      throw new AppError('Only owners can change member roles', 403, 'FORBIDDEN');
    }
    const result = await UserRepository.update(targetUserId, organizationId, { role: newRole });
    if (result.count === 0) {
      throw new AppError('User not found in your organization', 404, 'NOT_FOUND');
    }
    return UserRepository.findById(targetUserId, organizationId);
  }

  /**
   * Remove a member from the organization
   * @param {string} organizationId
   * @param {string} targetUserId
   * @param {string} callerRole
   * @param {string} callerId
   */
  static async removeMember(organizationId, targetUserId, callerRole, callerId) {
    if (callerRole !== 'owner') {
      throw new AppError('Only owners can remove team members', 403, 'FORBIDDEN');
    }
    if (targetUserId === callerId) {
      throw new AppError('You cannot remove yourself from the organization', 400, 'SELF_REMOVAL');
    }
    const result = await UserRepository.delete(targetUserId, organizationId);
    if (result.count === 0) {
      throw new AppError('User not found in your organization', 404, 'NOT_FOUND');
    }
  }
}

export default OrganizationService;
