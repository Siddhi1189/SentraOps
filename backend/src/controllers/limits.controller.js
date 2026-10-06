import prisma from '../config/db.js';
import ApiResponse from '../utils/apiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';

/**
 * The canonical quota values for the Q4 release.
 */
const LIMITS = {
  projects: { max: 5, description: 'Maximum projects per organization' },
  monitors: { max: 20, description: 'Maximum monitors (services) per organization' },
  ingestEventsPerMinutePerKey: { max: 100, description: 'Maximum error events ingested per minute per API key' },
  minCheckIntervalSeconds: { min: 30, description: 'Minimum health-check interval in seconds' },
  maxAssertionsPerMonitor: { max: 10, description: 'Maximum assertions per HTTP monitor' },
  dataRetentionDays: { health_checks: 90, error_events: 90, notifications: 90 },
};

const SUPPORTED = {
  monitorTypes: ['http', 'heartbeat'],
  assertionKinds: [
    'status_code_equals',
    'body_contains',
    'body_does_not_contain',
    'json_path_equals',
    'response_time_less_than',
  ],
  notificationChannels: ['email', 'slack', 'webhook'],
  incidentSeverities: ['low', 'medium', 'high', 'critical'],
};

const NOT_SUPPORTED = [
  'SMS / phone call alerts',
  'Uptime SLA reports (export)',
  'Custom retention beyond 90 days',
  'Multi-region distributed checks',
  'Browser / Playwright monitors',
  'DNS monitors',
  'TCP port monitors',
  'Stripe or Zapier integrations',
];

export const getLimits = asyncHandler(async (req, res) => {
  const { organizationId } = req.user;

  // Current usage
  const [projectCount, monitorCount] = await Promise.all([
    prisma.project.count({ where: { organizationId } }),
    prisma.service.count({ where: { organizationId } }),
  ]);

  return ApiResponse.success(res, {
    limits: LIMITS,
    supported: SUPPORTED,
    notSupported: NOT_SUPPORTED,
    usage: {
      projects: { current: projectCount, max: LIMITS.projects.max },
      monitors: { current: monitorCount, max: LIMITS.monitors.max },
    },
  });
});

export default { getLimits };
