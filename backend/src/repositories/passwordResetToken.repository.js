import prisma from '../config/db.js';

class PasswordResetTokenRepository {
  /**
   * Create a new password reset token
   * @param {Object} param0
   * @param {string} param0.userId
   * @param {string} param0.tokenHash
   * @param {Date} param0.expiresAt
   */
  static async create({ userId, tokenHash, expiresAt }) {
    return prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });
  }

  /**
   * Find an active (unused) password reset token by hash
   * @param {string} tokenHash
   */
  static async findByTokenHash(tokenHash) {
    return prisma.passwordResetToken.findFirst({
      where: { tokenHash },
      include: { user: true },
    });
  }

  /**
   * Mark a password reset token as used
   * @param {string} id
   */
  static async markAsUsed(id) {
    return prisma.passwordResetToken.update({
      where: { id },
      data: { used: true },
    });
  }

  /**
   * Delete existing password reset tokens for a user
   * @param {string} userId
   */
  static async deleteByUserId(userId) {
    return prisma.passwordResetToken.deleteMany({
      where: { userId },
    });
  }
}

export default PasswordResetTokenRepository;
