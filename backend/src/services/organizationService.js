import crypto from 'crypto';
import UserRepository from '../repositories/user.repository.js';
import OrganizationRepository from '../repositories/organization.repository.js';
import InviteTokenRepository from '../repositories/inviteToken.repository.js';
import RefreshTokenRepository from '../repositories/refreshToken.repository.js';
import EmailNotificationProvider from './notifications/EmailNotificationProvider.js';
import AuditService from './auditService.js';
import { hashPassword } from '../utils/hashPassword.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import AppError from '../utils/AppError.js';

const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

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
   * @param {string} [inviteData.name]
   * @param {string} inviteData.role
   * @param {string} inviterRole - Role of the person sending the invite
   */
  static async inviteMember(organizationId, { email, role }, inviterRole) {
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

    // Delete any prior pending invites for this email + organization combo
    await InviteTokenRepository.deletePendingByOrgAndEmail(organizationId, email);

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    await InviteTokenRepository.create({
      organizationId,
      email,
      role,
      tokenHash,
      expiresAt,
    });

    try {
      const emailProvider = new EmailNotificationProvider();
      await emailProvider.send({
        recipient: email,
        subject: 'Invitation to join SentraOps',
        body: `<p>You have been invited to join SentraOps as a <b>${role}</b>.</p><p>Use the following token to accept your invitation:</p><p><b>${rawToken}</b></p>`,
      });
    } catch (emailErr) {
      // Log email error
    }

    return { email, role, status: 'invited' };
  }

  /**
   * Accept an invitation and register user
   * @param {Object} param0
   * @param {string} param0.token
   * @param {string} param0.name
   * @param {string} param0.password
   */
  static async acceptInvite({ token, name, password }) {
    if (!token || !name || !password) {
      throw new AppError('Token, name, and password are required', 400, 'INVALID_INPUT');
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const inviteToken = await InviteTokenRepository.findByTokenHash(tokenHash);

    if (!inviteToken || inviteToken.acceptedAt || new Date() > new Date(inviteToken.expiresAt)) {
      throw new AppError('Invalid or expired invite token', 400, 'INVALID_TOKEN');
    }

    const existingUser = await UserRepository.findByEmail(inviteToken.email);
    if (existingUser) {
      throw new AppError('A user with this email already exists', 409, 'EMAIL_TAKEN');
    }

    const passwordHash = await hashPassword(password);
    const user = await UserRepository.create(inviteToken.organizationId, {
      name,
      email: inviteToken.email,
      passwordHash,
      role: inviteToken.role,
    });

    await InviteTokenRepository.markAccepted(inviteToken.id);

    await AuditService.record(
      inviteToken.organizationId,
      user.id,
      'user.invite_accepted',
      'User',
      user.id
    );

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    const refreshTokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    await RefreshTokenRepository.create(
      user.id,
      refreshTokenHash,
      new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS)
    );

    return { user, accessToken, refreshToken };
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
