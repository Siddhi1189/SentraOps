import AuditLogRepository from '../repositories/auditLog.repository.js';
import logger from '../utils/logger.js';

class AuditService {
  /**
   * Record an audit log entry for a mutating operation
   * @param {string} organizationId
   * @param {string|null} userId
   * @param {string} action  e.g. 'service.created', 'incident.resolved'
   * @param {string} entityType  e.g. 'Service', 'Incident'
   * @param {string|null} entityId
   * @param {Object} [metadata]
   */
  static async record(organizationId, userId, action, entityType, entityId, metadata = {}) {
    try {
      await AuditLogRepository.create({
        organizationId,
        userId: userId || null,
        action,
        entityType,
        entityId: entityId || null,
        metadata,
      });
    } catch (err) {
      // Audit failures should never break primary operations — log silently
      logger.error(`AuditService failed to record: ${err.message}`);
    }
  }

  /**
   * Get paginated audit logs for an organization
   * @param {string} organizationId
   * @param {Object} query
   */
  static async getLogs(organizationId, query) {
    return AuditLogRepository.findMany(organizationId, query);
  }
}

export default AuditService;
