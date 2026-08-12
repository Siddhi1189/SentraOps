import HealthCheckRepository from '../../src/repositories/healthCheck.repository.js';
import AuditLogRepository from '../../src/repositories/auditLog.repository.js';
import logger from '../../src/utils/logger.js';

/**
 * Execute background retention cleanup task
 * Purges health check records older than HEALTH_CHECK_RETENTION_DAYS (default 30)
 * Purges audit log entries older than AUDIT_LOG_RETENTION_DAYS (default 90)
 */
async function processCleanupJob() {
  const healthCheckRetentionDays = parseInt(process.env.HEALTH_CHECK_RETENTION_DAYS || '30', 10);
  const auditLogRetentionDays = parseInt(process.env.AUDIT_LOG_RETENTION_DAYS || '90', 10);

  const hcCutoff = new Date();
  hcCutoff.setDate(hcCutoff.getDate() - healthCheckRetentionDays);

  const auditCutoff = new Date();
  auditCutoff.setDate(auditCutoff.getDate() - auditLogRetentionDays);

  try {
    const deletedHealthChecks = await HealthCheckRepository.deleteOlderThan(hcCutoff);
    logger.info(`🧹 Background Cleanup: Purged ${deletedHealthChecks.count} health check records older than ${healthCheckRetentionDays} days.`);

    const deletedAuditLogs = await AuditLogRepository.deleteOlderThan(auditCutoff);
    logger.info(`🧹 Background Cleanup: Purged ${deletedAuditLogs.count} audit log records older than ${auditLogRetentionDays} days.`);
  } catch (err) {
    logger.error(`Error during background retention cleanup: ${err.message}`);
  }
}

export { processCleanupJob };
export default { processCleanupJob };
