import crypto from 'crypto';
import OrganizationRepository from '../repositories/organization.repository.js';
import UserRepository from '../repositories/user.repository.js';
import RefreshTokenRepository from '../repositories/refreshToken.repository.js';
import EscalationPolicyRepository from '../repositories/escalationPolicy.repository.js';
import StatusPageRepository from '../repositories/statusPage.repository.js';
import { hashPassword, comparePassword } from '../utils/hashPassword.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt.js';
import AppError from '../utils/AppError.js';

// Refresh token expiry: 7 days in ms
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

class AuthService {
  /**
   * Register a new organization and owner user
   */
  static async register({ organizationName, email, password, name }) {
    // Check if email already exists
    const existingUser = await UserRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError('An account with this email already exists', 409, 'EMAIL_TAKEN');
    }

    // Generate a unique slug from org name
    let slug = organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50);

    // Ensure slug uniqueness
    const slugExists = await OrganizationRepository.findBySlug(slug);
    if (slugExists) {
      slug = `${slug}-${Date.now()}`;
    }

    const passwordHash = await hashPassword(password);

    // Create organization, owner user, default escalation policy and status page in sequence
    const organization = await OrganizationRepository.create({ name: organizationName, slug });

    const user = await UserRepository.create(organization.id, {
      name,
      email,
      passwordHash,
      role: 'owner',
    });

    // Seed org-wide default escalation policy
    await EscalationPolicyRepository.upsert(organization.id, {
      serviceId: null,
      warningThreshold: 3,
      incidentThreshold: 5,
      criticalThreshold: 10,
    });

    // Seed default status page settings
    await StatusPageRepository.create(organization.id, {
      subdomain: slug,
      theme: 'light',
    });

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    await RefreshTokenRepository.create(
      user.id,
      tokenHash,
      new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS)
    );

    return { user, organization, accessToken, refreshToken };
  }

  /**
   * Login a user and issue tokens
   */
  static async login({ email, password }) {
    const user = await UserRepository.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      throw new AppError('Your account has been deactivated', 403, 'ACCOUNT_DEACTIVATED');
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

    await RefreshTokenRepository.create(
      user.id,
      tokenHash,
      new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS)
    );

    return { user, accessToken, refreshToken };
  }

  /**
   * Refresh access token using a valid refresh token
   */
  static async refreshTokens(refreshToken) {
    if (!refreshToken) {
      throw new AppError('Refresh token is required', 401, 'MISSING_REFRESH_TOKEN');
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      throw new AppError('Refresh token is invalid or expired', 401, 'INVALID_REFRESH_TOKEN');
    }

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const storedToken = await RefreshTokenRepository.findByTokenHash(tokenHash);

    if (!storedToken) {
      throw new AppError('Refresh token has been revoked or does not exist', 401, 'REVOKED_REFRESH_TOKEN');
    }

    // Rotate: revoke old token
    await RefreshTokenRepository.revokeByTokenHash(tokenHash);

    const user = storedToken.user;
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);
    const newTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');

    await RefreshTokenRepository.create(
      user.id,
      newTokenHash,
      new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS)
    );

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  /**
   * Logout: revoke the provided refresh token
   */
  static async logout(refreshToken) {
    if (!refreshToken) return;

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await RefreshTokenRepository.revokeByTokenHash(tokenHash);
  }
}

export default AuthService;
