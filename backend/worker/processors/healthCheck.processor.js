import ServiceRepository from '../../src/repositories/service.repository.js';
import HealthCheckRepository from '../../src/repositories/healthCheck.repository.js';
import EscalationPolicyRepository from '../../src/repositories/escalationPolicy.repository.js';
import MaintenanceWindowRepository from '../../src/repositories/maintenanceWindow.repository.js';
import IncidentRepository from '../../src/repositories/incident.repository.js';
import AlertRuleService from '../../src/services/alertRuleService.js';
import { evaluateAssertions } from '../../src/utils/assertionEvaluator.js';
import { getSslDaysRemaining } from '../../src/utils/sslChecker.js';
import logger from '../../src/utils/logger.js';

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

  const startTime = Date.now();
  let status = 'down';
  let httpStatusCode = null;
  let responseTimeMs = null;
  let sslDaysRemaining = null;
  let failedAssertion = null;
  let errorMessage = null;

  // 2. Branch: Heartbeat Monitor vs HTTP Monitor
  if (service.monitorType === 'heartbeat') {
    const intervalSec = service.heartbeatIntervalSeconds || 60;
    const graceSec = service.heartbeatGraceSeconds ?? 30;
    const allowedMs = (intervalSec + graceSec) * 1000;
    const lastPingTime = service.lastHeartbeatAt
      ? new Date(service.lastHeartbeatAt).getTime()
      : new Date(service.createdAt).getTime();

    const elapsedMs = Date.now() - lastPingTime;

    if (elapsedMs > allowedMs) {
      status = 'down';
      errorMessage = `Heartbeat missed: expected ping within ${intervalSec + graceSec}s, last ping was ${Math.round(elapsedMs / 1000)}s ago`;
    } else {
      status = 'up';
    }
  } else {
    // HTTP Monitor
    try {
      // Check SSL certificate expiry for HTTPS URLs
      if (service.url && service.url.startsWith('https:')) {
        sslDaysRemaining = await getSslDaysRemaining(service.url).catch(() => null);
        if (sslDaysRemaining !== null && sslDaysRemaining < 30) {
          await AlertRuleService.evaluateSslAlerts({ service, sslDaysRemaining }).catch((err) => {
            logger.warn(`Failed evaluating SSL alerts for service ${service.id}: ${err.message}`);
          });
        }
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), service.timeoutMs || 5000);

      const requestHeaders = {
        'User-Agent': 'SentraOps-HealthCheck-Worker/1.0',
        ...(service.requestHeaders || {}),
      };

      const fetchOptions = {
        method: service.httpMethod || 'GET',
        signal: controller.signal,
        headers: requestHeaders,
      };

      if (service.requestBody && ['POST', 'PUT', 'PATCH'].includes(service.httpMethod)) {
        fetchOptions.body = service.requestBody;
        if (!requestHeaders['Content-Type'] && !requestHeaders['content-type']) {
          fetchOptions.headers['Content-Type'] = 'application/json';
        }
      }

      const response = await fetch(service.url, fetchOptions);

      clearTimeout(timeoutId);
      responseTimeMs = Date.now() - startTime;
      httpStatusCode = response.status;
      const bodyString = await response.text().catch(() => '');

      // Check assertions if specified
      const hasAssertions = Array.isArray(service.assertions) && service.assertions.length > 0;
      if (hasAssertions) {
        const evalResult = evaluateAssertions(service.assertions, {
          httpStatusCode,
          responseTimeMs,
          bodyString,
        });

        if (evalResult.passed) {
          status = 'up';
        } else {
          status = 'down';
          failedAssertion = evalResult.failedAssertion;
          errorMessage = evalResult.errorMessage;
        }
      } else {
        // Fallback default status code check
        if (httpStatusCode === (service.expectedStatusCode || 200)) {
          status = 'up';
        } else {
          errorMessage = `HTTP status ${httpStatusCode} did not match expected ${service.expectedStatusCode || 200}`;
        }
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
  }

  // 3. Log health check result to database via Repository
  await HealthCheckRepository.create({
    serviceId: service.id,
    status,
    httpStatusCode,
    responseTimeMs,
    sslDaysRemaining,
    failedAssertion,
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
    // Evaluate response_time_threshold rules on healthy checks
    await AlertRuleService.evaluateHealthCheckAlerts({
      service,
      status: 'up',
      consecutiveFailures: 0,
      responseTimeMs,
      errorMessage: null,
      activeMaintenance: false,
    });

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
      sslDaysRemaining,
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

  // Evaluate alert rules (replaces hardcoded notification with rule evaluation & default fallback)
  await AlertRuleService.evaluateHealthCheckAlerts({
    service,
    status,
    consecutiveFailures: newFailures,
    responseTimeMs,
    errorMessage,
    activeMaintenance: false,
    createdIncident,
  });

  if (createdIncident) {
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
    sslDaysRemaining,
    errorMessage,
    checkedAt: new Date(),
  });
}

export { processHealthCheckJob };
export default { processHealthCheckJob };
