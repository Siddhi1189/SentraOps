import AlertRuleRepository from '../repositories/alertRule.repository.js';
import AlertChannelRepository from '../repositories/alertChannel.repository.js';
import ErrorEventRepository from '../repositories/errorEvent.repository.js';
import NotificationService from './notifications/notificationService.js';
import { enqueueNotification } from '../config/queue.js';
import { NotificationChannels } from '../constants.js';
import logger from '../utils/logger.js';
import AppError from '../utils/AppError.js';

class AlertRuleService {
  /**
   * Helper to check if a rule is currently snoozed or within its cooldown period
   * @param {Object} rule
   * @returns {boolean}
   */
  static isRuleSuppressed(rule) {
    const now = Date.now();

    // Check snooze
    if (rule.snoozedUntil && new Date(rule.snoozedUntil).getTime() > now) {
      return true;
    }

    // Check cooldown from latest fire
    const lastFire = rule.fires?.[0];
    if (lastFire && rule.cooldownSeconds > 0) {
      const lastFiredAt = new Date(lastFire.firedAt).getTime();
      const cooldownMs = rule.cooldownSeconds * 1000;
      if (now - lastFiredAt < cooldownMs) {
        return true;
      }
    }

    return false;
  }

  /**
   * Helper to dispatch notifications to a rule's active channels
   * @param {Object} rule
   * @param {string} subject
   * @param {string} body
   * @param {Object} [context]
   */
  static async dispatchRuleAlert(rule, subject, body, context = {}) {
    if (!rule.channels || rule.channels.length === 0) {
      logger.warn(`Alert rule ${rule.id} (${rule.name}) fired but has no active channels assigned.`);
      return;
    }

    for (const channel of rule.channels) {
      if (!channel.isActive) continue;

      let recipient;
      if (channel.type === NotificationChannels.EMAIL) {
        recipient = channel.config?.recipients;
      } else {
        recipient = channel.config?.url;
      }

      if (!recipient) {
        logger.warn(`Channel ${channel.id} (${channel.name}) missing recipient or url in config`);
        continue;
      }

      await enqueueNotification({
        organizationId: rule.organizationId,
        channel: channel.type,
        recipient,
        subject,
        body,
      });
    }
  }

  /**
   * Evaluate health check related alerts:
   * 1. service_down_consecutive_failures
   * 2. response_time_threshold
   * Also handles default incident email fallback when organization has no rules.
   *
   * @param {Object} params
   * @param {Object} params.service
   * @param {string} params.status ('up' | 'down' | 'timeout')
   * @param {number} params.consecutiveFailures
   * @param {number} params.responseTimeMs
   * @param {string} [params.errorMessage]
   * @param {boolean} [params.activeMaintenance]
   * @param {Object} [params.createdIncident]
   */
  static async evaluateHealthCheckAlerts({
    service,
    status,
    consecutiveFailures,
    responseTimeMs,
    errorMessage = '',
    activeMaintenance = false,
    createdIncident = null,
  }) {
    // 1. Respect maintenance window: suppress all service alerts during maintenance
    if (activeMaintenance) {
      return;
    }

    const organizationId = service.organizationId;
    const totalRules = await AlertRuleRepository.countRules(organizationId);

    // 2. Fallback: if organization has NO alert rules defined, preserve existing default email on incident creation
    if (totalRules === 0) {
      if (createdIncident) {
        await enqueueNotification({
          organizationId,
          incidentId: createdIncident.id,
          channel: NotificationChannels.EMAIL,
          subject: `Incident Created: ${service.name} is DOWN`,
          body: `<p>Service <strong>${service.name}</strong> has failed ${consecutiveFailures} health checks.</p><p>Error: ${errorMessage}</p>`,
        });
      }
      return;
    }

    // 3. Evaluate service_down_consecutive_failures
    if (status !== 'up') {
      const downRules = await AlertRuleRepository.findMatchingRules(
        organizationId,
        'service_down_consecutive_failures',
        { serviceId: service.id }
      );

      for (const rule of downRules) {
        const threshold = rule.conditions?.consecutiveFailures ?? 3;
        if (consecutiveFailures >= threshold) {
          if (this.isRuleSuppressed(rule)) {
            continue;
          }

          const context = {
            serviceId: service.id,
            serviceName: service.name,
            consecutiveFailures,
            threshold,
            errorMessage,
          };

          await AlertRuleRepository.recordFire(rule.id, context);

          const subject = `Alert: ${service.name} is DOWN (${consecutiveFailures} consecutive failures)`;
          const body = `<p>Service <strong>${service.name}</strong> reached ${consecutiveFailures} consecutive failures (Rule: <em>${rule.name}</em>).</p><p>Error: ${errorMessage || 'No error message provided'}</p>`;

          await this.dispatchRuleAlert(rule, subject, body, context);
        }
      }
    }

    // 4. Evaluate response_time_threshold
    if (responseTimeMs > 0) {
      const responseTimeRules = await AlertRuleRepository.findMatchingRules(
        organizationId,
        'response_time_threshold',
        { serviceId: service.id }
      );

      for (const rule of responseTimeRules) {
        const thresholdMs = rule.conditions?.thresholdMs ?? 2000;
        if (responseTimeMs >= thresholdMs) {
          if (this.isRuleSuppressed(rule)) {
            continue;
          }

          const context = {
            serviceId: service.id,
            serviceName: service.name,
            responseTimeMs,
            thresholdMs,
          };

          await AlertRuleRepository.recordFire(rule.id, context);

          const subject = `Alert: ${service.name} slow response (${responseTimeMs}ms >= ${thresholdMs}ms)`;
          const body = `<p>Service <strong>${service.name}</strong> response time was ${responseTimeMs}ms, exceeding threshold of ${thresholdMs}ms (Rule: <em>${rule.name}</em>).</p>`;

          await this.dispatchRuleAlert(rule, subject, body, context);
        }
      }
    }
  }

  /**
   * Evaluate ingest related alerts:
   * 1. new_issue_in_environment
   * 2. event_rate_threshold
   *
   * @param {Object} params
   * @param {string} params.projectId
   * @param {string} params.organizationId
   * @param {Object} params.issue
   * @param {boolean} params.isNew
   * @param {boolean} params.isRegression
   * @param {boolean} params.isIgnored
   */
  static async evaluateIngestAlerts({
    projectId,
    organizationId,
    issue,
    isNew,
    isRegression,
    isIgnored,
  }) {
    if (isIgnored) return;

    const totalRules = await AlertRuleRepository.countRules(organizationId);
    if (totalRules === 0) return;

    // 1. Evaluate new_issue_in_environment (triggers on new issue or regression)
    if (isNew || isRegression) {
      const newIssueRules = await AlertRuleRepository.findMatchingRules(
        organizationId,
        'new_issue_in_environment',
        { projectId }
      );

      for (const rule of newIssueRules) {
        const targetEnv = rule.conditions?.environment;
        if (!targetEnv || targetEnv.toLowerCase() === issue.environment.toLowerCase()) {
          if (this.isRuleSuppressed(rule)) {
            continue;
          }

          const context = {
            issueId: issue.id,
            title: issue.title,
            environment: issue.environment,
            isRegression,
            isNew,
          };

          await AlertRuleRepository.recordFire(rule.id, context);

          const typeLabel = isRegression ? 'Issue Regressed' : 'New Issue';
          const subject = `Alert: ${typeLabel} in ${issue.environment} - ${issue.title}`;
          const body = `<p>A ${typeLabel.toLowerCase()} was detected in environment <strong>${issue.environment}</strong>.</p><p><strong>${issue.title}</strong></p><p>Rule: <em>${rule.name}</em></p>`;

          await this.dispatchRuleAlert(rule, subject, body, context);
        }
      }
    }

    // 2. Evaluate event_rate_threshold
    const eventRateRules = await AlertRuleRepository.findMatchingRules(
      organizationId,
      'event_rate_threshold',
      { projectId }
    );

    for (const rule of eventRateRules) {
      const threshold = rule.conditions?.threshold ?? 100;
      const windowSeconds = rule.conditions?.windowSeconds ?? 60;
      const sinceDate = new Date(Date.now() - windowSeconds * 1000);

      const count = await ErrorEventRepository.countEventsByProjectSince(projectId, sinceDate);
      if (count >= threshold) {
        if (this.isRuleSuppressed(rule)) {
          continue;
        }

        const context = {
          projectId,
          eventCount: count,
          threshold,
          windowSeconds,
        };

        await AlertRuleRepository.recordFire(rule.id, context);

        const subject = `Alert: High error rate on project (${count} events in ${windowSeconds}s)`;
        const body = `<p>Error event rate exceeded threshold: <strong>${count}</strong> events occurred in the last ${windowSeconds} seconds (Threshold: ${threshold}).</p><p>Rule: <em>${rule.name}</em></p>`;

        await this.dispatchRuleAlert(rule, subject, body, context);
      }
    }
  }

  /**
   * Send a test message through an existing AlertChannel
   * @param {string} channelId
   * @param {string} organizationId
   * @param {Object} user
   */
  static async sendTestAlert(channelId, organizationId, user) {
    const channel = await AlertChannelRepository.findById(channelId, organizationId);
    if (!channel) {
      throw new AppError('Alert channel not found', 404);
    }

    let recipient;
    if (channel.type === NotificationChannels.EMAIL) {
      const rec = channel.config?.recipients;
      recipient = Array.isArray(rec) && rec.length > 0 ? rec[0] : (user?.email || 'admin@example.com');
    } else {
      recipient = channel.config?.url;
    }

    if (!recipient) {
      throw new AppError(`Cannot send test: channel configuration missing recipient or URL`, 400);
    }

    const testPayload = {
      recipient,
      subject: `SentraOps Test Alert: ${channel.name}`,
      body: `This is a test alert verifying your ${channel.type.toUpperCase()} integration with SentraOps.`,
    };

    const result = await NotificationService.dispatch(channel.type, testPayload);

    return {
      success: true,
      message: `Test alert dispatched successfully to ${channel.name}`,
      result,
    };
  }

  /**
   * Evaluate SSL expiration warnings for services
   * @param {Object} params
   * @param {Object} params.service
   * @param {number} params.sslDaysRemaining
   */
  static async evaluateSslAlerts({ service, sslDaysRemaining }) {
    if (sslDaysRemaining === null || sslDaysRemaining === undefined || sslDaysRemaining >= 30) {
      return;
    }

    const organizationId = service.organizationId;
    const rules = await AlertRuleRepository.findMatchingRules(
      organizationId,
      'ssl_expiration_warning',
      { serviceId: service.id }
    );

    for (const rule of rules) {
      const thresholdDays = rule.conditions?.thresholdDays ?? 30;
      if (sslDaysRemaining <= thresholdDays) {
        if (this.isRuleSuppressed(rule)) continue;

        const context = {
          serviceId: service.id,
          serviceName: service.name,
          sslDaysRemaining,
          thresholdDays,
        };

        await AlertRuleRepository.recordFire(rule.id, context);

        const subject = `Warning: SSL Certificate for ${service.name} expires in ${sslDaysRemaining} days`;
        const body = `<p>The SSL certificate for <strong>${service.name}</strong> (${service.url}) will expire in <strong>${sslDaysRemaining}</strong> days (threshold: ${thresholdDays} days).</p>`;

        await this.dispatchRuleAlert(rule, subject, body, context);
      }
    }
  }
}

export default AlertRuleService;
