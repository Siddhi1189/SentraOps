import prisma from '../config/db.js';

class InviteTokenRepository {
  /**
   * Create a new invite token record
   * @param {Object} param0
   * @param {string} param0.organizationId
   * @param {string} param0.email
   * @param {string} param0.role
   * @param {string} param0.tokenHash
   * @param {Date} param0.expiresAt
   */
  static async create({ organizationId, email, role, tokenHash, expiresAt }) {
    return prisma.inviteToken.create({
      data: {
        organizationId,
        email,
        role,
        tokenHash,
        expiresAt,
      },
    });
  }

  /**
   * Find an active invite token by hash
   * @param {string} tokenHash
   */
  static async findByTokenHash(tokenHash) {
    return prisma.inviteToken.findFirst({
      where: { tokenHash },
      include: { organization: true },
    });
  }

  /**
   * Mark an invite token as accepted
   * @param {string} id
   */
  static async markAccepted(id) {
    return prisma.inviteToken.update({
      where: { id },
      data: { acceptedAt: new Date() },
    });
  }

  /**
   * Delete pending (unaccepted) invite tokens for an email within an organization
   * @param {string} organizationId
   * @param {string} email
   */
  static async deletePendingByOrgAndEmail(organizationId, email) {
    return prisma.inviteToken.deleteMany({
      where: {
        organizationId,
        email,
        acceptedAt: null,
      },
    });
  }
}

export default InviteTokenRepository;
