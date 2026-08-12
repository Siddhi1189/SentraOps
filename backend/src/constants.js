/**
 * SentraOps System Constants & Enums
 */

const UserRoles = {
  OWNER: 'owner',
  ADMIN: 'admin',
  VIEWER: 'viewer',
};

const HttpMethods = {
  GET: 'GET',
  POST: 'POST',
  HEAD: 'HEAD',
  PUT: 'PUT',
};

const PriorityLevels = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

const ServiceStatuses = {
  UP: 'up',
  DOWN: 'down',
  DEGRADED: 'degraded',
  MAINTENANCE: 'maintenance',
  UNKNOWN: 'unknown',
};

const HealthStatuses = {
  UP: 'up',
  DOWN: 'down',
  TIMEOUT: 'timeout',
};

const IncidentStatuses = {
  OPEN: 'open',
  INVESTIGATING: 'investigating',
  IDENTIFIED: 'identified',
  MONITORING: 'monitoring',
  RESOLVED: 'resolved',
};

const IncidentSeverities = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

const MaintenanceStatuses = {
  SCHEDULED: 'scheduled',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
};

const NotificationChannels = {
  EMAIL: 'email',
  SLACK: 'slack',
  DISCORD: 'discord',
  WEBHOOK: 'webhook',
};

const NotificationStatuses = {
  PENDING: 'pending',
  SENT: 'sent',
  FAILED: 'failed',
};

const TimelineEventTypes = {
  HEALTH_CHECK_FAILED: 'health_check_failed',
  FAILURE_COUNT_INCREASED: 'failure_count_increased',
  INCIDENT_CREATED: 'incident_created',
  STATUS_CHANGED: 'status_changed',
  ASSIGNED: 'assigned',
  COMMENT_ADDED: 'comment_added',
  RESOLVED: 'resolved',
  NOTIFICATION_SENT: 'notification_sent',
};

const EnvironmentTypes = {
  PRODUCTION: 'production',
  STAGING: 'staging',
};

export { UserRoles, HttpMethods, PriorityLevels, ServiceStatuses, HealthStatuses, IncidentStatuses, IncidentSeverities, MaintenanceStatuses, NotificationChannels, NotificationStatuses, TimelineEventTypes, EnvironmentTypes };
export default {
  UserRoles,
  HttpMethods,
  PriorityLevels,
  ServiceStatuses,
  HealthStatuses,
  IncidentStatuses,
  IncidentSeverities,
  MaintenanceStatuses,
  NotificationChannels,
  NotificationStatuses,
  TimelineEventTypes,
  EnvironmentTypes,
};
