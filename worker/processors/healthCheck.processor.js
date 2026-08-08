import ServiceRepository from '../../src/repositories/service.repository.js';
import HealthCheckRepository from '../../src/repositories/healthCheck.repository.js';
import EscalationPolicyRepository from '../../src/repositories/escalationPolicy.repository.js';
import MaintenanceWindowRepository from '../../src/repositories/maintenanceWindow.repository.js';
import IncidentRepository from '../../src/repositories/incident.repository.js';
import { enqueueNotification } from '../../src/config/queue.js';
import logger from '../../src/utils/logger.js';
import { NotificationChannels } from '../../src/constants.js';

/**
 * Process a health-check BullMQ job
 * @param {Object} job BullMQ Job object containing { serviceId }
 * @param {Function} publishEvent Helper function to broadcast event via Redis pub/sub
 */
async function processHealthCheckJob(job, publishEvent) {
  const { serviceId } = job.data;

  // 1. Fetch service record via Repository
  const service = await ServiceRepository.findWorkerServiceById(serviceId);

  if (!service || !service.isActive) {
    return;
  }

  // 2. Perform HTTP health check request with timeout
  const startTime = Date.now();
  let status = 'down';
  let httpStatusCode = null;
  let responseTimeMs = null;
  let errorMessage = null;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), service.timeoutMs || 5000);

    const response = await fetch(service.url, {
      method: service.httpMethod || 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'SentraOps-HealthCheck-Worker/1.0',
      },
    });

    clearTimeout(timeoutId);
    responseTimeMs = Date.now() - startTime;
    httpStatusCode = response.status;

    if (httpStatusCode === (service.expectedStatusCode || 200)) {
      status = 'up';
    } else {
      errorMessage = `HTTP status ${httpStatusCode} did not match expected ${service.expectedStatusCode || 200}`;
    }
  } catch (err) {
    responseTimeMs = Date.now() - startTime;
    if (err.name === 'AbortError') {
      status = 'timeout';
      errorMessage = `Request timed out after ${service.timeoutMs}ms`;
    } else {
      errorMessage = err.message || 'Connection failed';
    }
  }

  // 3. Log health check result to database via Repository
  await HealthCheckRepository.create({
    serviceId: service.id,
    status,
    httpStatusCode,
    responseTimeMs,
    errorMessage,
  });

  // 4. Check for active maintenance window overriding this service
  const activeMaintenance = await MaintenanceWindowRepository.findActiveWindowForService(service.id);
  if (activeMaintenance) {
    if (service.currentStatus !== 'maintenance') {
      await ServiceRepository.workerUpdateStatus(service.id, {
        currentStatus: 'maintenance',
        consecutiveFailures: 0,
      });
      publishEvent(service.organizationId, 'maintenance-started', {
        serviceId: service.id,
        maintenanceId: activeMaintenance.id,
      });
    }
    return; // Skip incident creation/recovery while under active maintenance
  }

  // 5. Retrieve effective escalation policy thresholds
  const policy = await EscalationPolicyRepository.findEffectivePolicy(
    service.id,
    service.organizationId
  );

  // 6. Handle SUCCESS branch (including AUTOMATIC RECOVERY LOGIC)
  if (status === 'up') {
    const openIncident = await IncidentRepository.processWorkerRecovery(
      service,
      responseTimeMs,
      httpStatusCode
    );

    if (openIncident) {
      publishEvent(service.organizationId, 'incident-updated', {
        incidentId: openIncident.id,
        status: 'resolved',
        resolvedAt: new Date(),
      });
      logger.info(`Auto-resolved incident ${openIncident.id} for recovered service ${service.name}`);
    }

    publishEvent(service.organizationId, 'health-check-updated', {
      serviceId: service.id,
      status: 'up',
      consecutiveFailures: 0,
      responseTimeMs,
      checkedAt: new Date(),
    });
    return;
  }

  // 7. Handle FAILURE branch (consecutive failure increment, incident creation, escalation)
  const newFailures = service.consecutiveFailures + 1;

  const { createdIncident, escalatedIncident } = await IncidentRepository.processWorkerFailure(
    service,
    newFailures,
    policy,
    errorMessage,
    httpStatusCode
  );

  if (createdIncident) {
    // Enqueue notification job
    await enqueueNotification({
      organizationId: service.organizationId,
      incidentId: createdIncident.id,
      channel: NotificationChannels.EMAIL,
      subject: `🚨 Incident Created: ${service.name} is DOWN`,
      body: `<p>Service <strong>${service.name}</strong> has failed ${newFailures} health checks.</p><p>Error: ${errorMessage}</p>`,
    });

    publishEvent(service.organizationId, 'incident-created', { incident: createdIncident });
    logger.info(`Created incident ${createdIncident.id} for service ${service.name} after ${newFailures} failures`);
  } else if (escalatedIncident) {
    publishEvent(service.organizationId, 'incident-updated', {
      incidentId: escalatedIncident.id,
      severity: 'critical',
    });
  }

  publishEvent(service.organizationId, 'health-check-updated', {
    serviceId: service.id,
    status,
    consecutiveFailures: newFailures,
    responseTimeMs,
    errorMessage,
    checkedAt: new Date(),
  });
}

export { processHealthCheckJob };
export default { processHealthCheckJob };
