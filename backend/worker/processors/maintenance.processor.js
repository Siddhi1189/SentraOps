import MaintenanceWindowRepository from '../../src/repositories/maintenanceWindow.repository.js';
import ServiceRepository from '../../src/repositories/service.repository.js';
import logger from '../../src/utils/logger.js';

/**
 * Processor for the maintenanceQueue.
 * Handles maintenance window state transitions: scheduled → in_progress → completed.
 * On each transition, updates the associated service's currentStatus and publishes
 * a real-time event via Redis pub/sub.
 *
 * @param {Object} job BullMQ Job object
 * @param {Function} publishEvent Helper to publish pub/sub event to Redis channel
 */
async function processMaintenanceJob(job, publishEvent) {
  const { toStart, toComplete } = await MaintenanceWindowRepository.findPendingStatusTransitions();

  for (const window of toStart) {
    await MaintenanceWindowRepository.workerUpdateStatus(window.id, 'in_progress');
    if (window.serviceId) {
      await ServiceRepository.workerUpdateStatus(window.serviceId, { currentStatus: 'maintenance' });
    }
    publishEvent(window.organizationId, 'maintenance-started', { maintenanceId: window.id });
    logger.info(`Maintenance window '${window.title}' transitioned to in_progress`, {
      maintenanceId: window.id,
      organizationId: window.organizationId,
    });
  }

  for (const window of toComplete) {
    await MaintenanceWindowRepository.workerUpdateStatus(window.id, 'completed');
    if (window.serviceId) {
      await ServiceRepository.workerUpdateStatus(window.serviceId, { currentStatus: 'unknown' });
    }
    publishEvent(window.organizationId, 'maintenance-ended', { maintenanceId: window.id });
    logger.info(`Maintenance window '${window.title}' transitioned to completed`, {
      maintenanceId: window.id,
      organizationId: window.organizationId,
    });
  }
}

export { processMaintenanceJob };
export default { processMaintenanceJob };
