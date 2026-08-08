import prisma from '../config/db.js';

class RefreshTokenRepository {
  /**
   * Create a new refresh token
   * @param {string} userId 
   * @param {string} tokenHash 
   * @param {Date} expiresAt 
   */
  static async create(userId, tokenHash, expiresAt) {
    return prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });
  }

  /**
   * Find a refresh token by hash
   * @param {string} tokenHash 
   */
  static async findByTokenHash(tokenHash) {
    return prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: true,
      },
    });
  }

  /**
   * Revoke a specific refresh token by hash
   * @param {string} tokenHash 
   */
  static async revokeByTokenHash(tokenHash) {
    return prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
  }

  /**
   * Revoke all active refresh tokens for a user
   * @param {string} userId 
   */
  static async revokeAllForUser(userId) {
    return prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}

export default RefreshTokenRepository;
