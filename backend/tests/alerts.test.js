import { jest } from '@jest/globals';
import request from 'supertest';
import { signAccessToken } from '../src/utils/jwt.js';

const mockDb = {
  alertChannel: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  alertRule: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  alertRuleFire: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  errorEvent: {
    count: jest.fn(),
    create: jest.fn(),
  },
  project: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
  },
  service: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
  },
  organization: {
    findUnique: jest.fn(),
  },
  $transaction: jest.fn((cb) => cb(mockDb)),
  $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
  $on: jest.fn(),
};

const mockEnqueueNotification = jest.fn().mockResolvedValue({ id: 'job-notif-1' });

jest.unstable_mockModule('../src/config/db.js', () => ({
  default: mockDb,
}));

jest.unstable_mockModule('../src/config/queue.js', () => ({
  healthCheckQueue: { add: jest.fn() },
  notificationQueue: { add: jest.fn() },
  maintenanceQueue: { add: jest.fn() },
  ingestQueue: { add: jest.fn() },
  enqueueNotification: mockEnqueueNotification,
  enqueueIngestEvent: jest.fn(),
  registerServiceJob: jest.fn(),
  removeServiceJob: jest.fn(),
  enqueueMaintenanceCheck: jest.fn(),
  default: {
    enqueueNotification: mockEnqueueNotification,
  },
}));

const mockNotificationDispatch = jest.fn().mockResolvedValue({ success: true });
jest.unstable_mockModule('../src/services/notifications/notificationService.js', () => ({
  default: {
    dispatch: mockNotificationDispatch,
  },
}));

// Import app after mocking
const { default: app } = await import('../src/app.js');
const { default: AlertRuleService } = await import('../src/services/alertRuleService.js');

describe('Step 2.5: Alert Rules & Notification Channels', () => {
  const orgId = '00000000-0000-0000-0000-000000000001';
  const ownerToken = signAccessToken({
    userId: '11111111-1111-1111-1111-111111111111',
    organizationId: orgId,
    role: 'owner',
    email: 'owner@test.com',
  });
  const viewerToken = signAccessToken({
    userId: '22222222-2222-2222-2222-222222222222',
    organizationId: orgId,
    role: 'viewer',
    email: 'viewer@test.com',
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Alert Channels API', () => {
    it('creates an alert channel and masks secret URL in the response', async () => {
      const createdChannel = {
        id: 'channel-1',
        organizationId: orgId,
        name: 'Slack Alerts',
        type: 'slack',
        config: { url: 'https://hooks.slack.com/services/T000/B000/SECRET_TOKEN_123' },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockDb.alertChannel.create.mockResolvedValue(createdChannel);

      const res = await request(app)
        .post('/api/alert-channels')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Slack Alerts',
          type: 'slack',
          config: { url: 'https://hooks.slack.com/services/T000/B000/SECRET_TOKEN_123' },
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.config.url).toContain('https://hooks.slack.com/...****');
      expect(res.body.data.config.url).not.toContain('SECRET_TOKEN_123');
    });

    it('rejects creation for viewer role', async () => {
      const res = await request(app)
        .post('/api/alert-channels')
        .set('Authorization', `Bearer ${viewerToken}`)
        .send({
          name: 'Slack Alerts',
          type: 'slack',
          config: { url: 'https://hooks.slack.com/services/T/B/X' },
        });

      expect(res.status).toBe(403);
    });

    it('lists alert channels with masked secrets for viewer role', async () => {
      mockDb.alertChannel.findMany.mockResolvedValue([
        {
          id: 'channel-1',
          organizationId: orgId,
          name: 'Webhook Ops',
          type: 'webhook',
          config: { url: 'https://api.example.com/alerts?secret=sensitive_key' },
          isActive: true,
        },
      ]);

      const res = await request(app)
        .get('/api/alert-channels')
        .set('Authorization', `Bearer ${viewerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data[0].config.url).toContain('...****');
      expect(res.body.data[0].config.url).not.toContain('sensitive_key');
    });

    it('sends a test alert through POST /api/alert-channels/:id/test', async () => {
      mockDb.alertChannel.findFirst.mockResolvedValue({
        id: 'channel-1',
        organizationId: orgId,
        name: 'Slack Ops',
        type: 'slack',
        config: { url: 'https://hooks.slack.com/services/T/B/X' },
        isActive: true,
      });

      const res = await request(app)
        .post('/api/alert-channels/channel-1/test')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockNotificationDispatch).toHaveBeenCalledWith('slack', expect.objectContaining({
        recipient: 'https://hooks.slack.com/services/T/B/X',
      }));
    });
  });

  describe('Alert Rules API', () => {
    it('creates an alert rule with trigger-specific conditions', async () => {
      const createdRule = {
        id: 'rule-1',
        organizationId: orgId,
        name: 'High consecutive failures',
        trigger: 'service_down_consecutive_failures',
        conditions: { consecutiveFailures: 3 },
        serviceId: 'service-1',
        projectId: null,
        cooldownSeconds: 300,
        snoozedUntil: null,
        isActive: true,
        channels: [
          {
            id: 'channel-1',
            name: 'Slack',
            type: 'slack',
            config: { url: 'https://hooks.slack.com/test' },
          },
        ],
        fires: [],
      };
      mockDb.alertRule.create.mockResolvedValue(createdRule);

      const res = await request(app)
        .post('/api/alert-rules')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'High consecutive failures',
          trigger: 'service_down_consecutive_failures',
          conditions: { consecutiveFailures: 3 },
          channelIds: ['44444444-4444-4444-4444-444444444444'],
          serviceId: '33333333-3333-3333-3333-333333333333',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.trigger).toBe('service_down_consecutive_failures');
      expect(res.body.data.channels[0].config.url).toContain('...****');
    });

    it('rejects invalid trigger conditions', async () => {
      const res = await request(app)
        .post('/api/alert-rules')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Bad rule',
          trigger: 'service_down_consecutive_failures',
          conditions: { consecutiveFailures: -5 }, // Invalid: min is 1
          channelIds: ['44444444-4444-4444-4444-444444444444'],
        });

      expect(res.status).toBe(400);
    });

    it('snoozes and unsnoozes an alert rule', async () => {
      const snoozeDate = new Date(Date.now() + 3600000).toISOString();
      mockDb.alertRule.findFirst.mockResolvedValue({
        id: 'rule-1',
        organizationId: orgId,
      });
      mockDb.alertRule.update.mockResolvedValue({
        id: 'rule-1',
        organizationId: orgId,
        snoozedUntil: new Date(snoozeDate),
        channels: [],
        fires: [],
      });

      // Snooze
      const snoozeRes = await request(app)
        .post('/api/alert-rules/rule-1/snooze')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ until: snoozeDate });

      expect(snoozeRes.status).toBe(200);
      expect(snoozeRes.body.success).toBe(true);

      // Unsnooze
      mockDb.alertRule.update.mockResolvedValue({
        id: 'rule-1',
        organizationId: orgId,
        snoozedUntil: null,
        channels: [],
        fires: [],
      });

      const unsnoozeRes = await request(app)
        .delete('/api/alert-rules/rule-1/snooze')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(unsnoozeRes.status).toBe(200);
      expect(unsnoozeRes.body.success).toBe(true);
    });
  });

  describe('AlertRuleService Evaluation Logic', () => {
    it('evaluates service_down_consecutive_failures and dispatches alert', async () => {
      mockDb.alertRule.count.mockResolvedValue(1);
      mockDb.alertRule.findMany.mockResolvedValue([
        {
          id: 'rule-down',
          organizationId: orgId,
          name: 'Service Down Rule',
          trigger: 'service_down_consecutive_failures',
          conditions: { consecutiveFailures: 3 },
          cooldownSeconds: 300,
          snoozedUntil: null,
          isActive: true,
          channels: [
            {
              id: 'chan-1',
              type: 'slack',
              isActive: true,
              config: { url: 'https://hooks.slack.com/services/T/B/X' },
            },
          ],
          fires: [],
        },
      ]);
      mockDb.alertRuleFire.create.mockResolvedValue({ id: 'fire-1' });

      await AlertRuleService.evaluateHealthCheckAlerts({
        service: { id: 'srv-1', organizationId: orgId, name: 'Billing API' },
        status: 'down',
        consecutiveFailures: 3,
        responseTimeMs: 0,
        errorMessage: 'Connection refused',
      });

      expect(mockDb.alertRuleFire.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ ruleId: 'rule-down' }),
      }));
      expect(mockEnqueueNotification).toHaveBeenCalledWith(expect.objectContaining({
        organizationId: orgId,
        channel: 'slack',
        recipient: 'https://hooks.slack.com/services/T/B/X',
      }));
    });

    it('suppresses alerts during active maintenance window', async () => {
      mockDb.alertRule.count.mockResolvedValue(1);

      await AlertRuleService.evaluateHealthCheckAlerts({
        service: { id: 'srv-1', organizationId: orgId, name: 'Billing API' },
        status: 'down',
        consecutiveFailures: 5,
        responseTimeMs: 0,
        activeMaintenance: true, // under maintenance
      });

      expect(mockDb.alertRule.findMany).not.toHaveBeenCalled();
      expect(mockEnqueueNotification).not.toHaveBeenCalled();
    });

    it('suppresses alerts when rule is within cooldown period', async () => {
      mockDb.alertRule.count.mockResolvedValue(1);
      mockDb.alertRule.findMany.mockResolvedValue([
        {
          id: 'rule-cooldown',
          organizationId: orgId,
          name: 'Cooldown Rule',
          trigger: 'service_down_consecutive_failures',
          conditions: { consecutiveFailures: 1 },
          cooldownSeconds: 600, // 10 minutes
          snoozedUntil: null,
          isActive: true,
          channels: [{ id: 'chan-1', type: 'slack', isActive: true, config: { url: 'https://slack' } }],
          fires: [
            { firedAt: new Date(Date.now() - 60000) }, // fired 1 min ago
          ],
        },
      ]);

      await AlertRuleService.evaluateHealthCheckAlerts({
        service: { id: 'srv-1', organizationId: orgId, name: 'Auth API' },
        status: 'down',
        consecutiveFailures: 2,
        responseTimeMs: 0,
      });

      expect(mockDb.alertRuleFire.create).not.toHaveBeenCalled();
      expect(mockEnqueueNotification).not.toHaveBeenCalled();
    });

    it('falls back to default email when organization has 0 alert rules defined', async () => {
      mockDb.alertRule.count.mockResolvedValue(0); // 0 alert rules

      await AlertRuleService.evaluateHealthCheckAlerts({
        service: { id: 'srv-1', organizationId: orgId, name: 'Auth API' },
        status: 'down',
        consecutiveFailures: 3,
        responseTimeMs: 0,
        errorMessage: '500 Internal Server Error',
        createdIncident: { id: 'inc-1' },
      });

      expect(mockEnqueueNotification).toHaveBeenCalledWith(expect.objectContaining({
        organizationId: orgId,
        incidentId: 'inc-1',
        channel: 'email',
        subject: expect.stringContaining('Incident Created: Auth API is DOWN'),
      }));
    });

    it('evaluates new_issue_in_environment during ingest', async () => {
      mockDb.alertRule.count.mockResolvedValue(1);
      mockDb.alertRule.findMany.mockResolvedValue([
        {
          id: 'rule-env',
          organizationId: orgId,
          name: 'Staging New Issue Rule',
          trigger: 'new_issue_in_environment',
          conditions: { environment: 'staging' },
          cooldownSeconds: 300,
          snoozedUntil: null,
          isActive: true,
          channels: [
            {
              id: 'chan-1',
              type: 'webhook',
              isActive: true,
              config: { url: 'https://webhook.site/test' },
            },
          ],
          fires: [],
        },
      ]);
      mockDb.alertRuleFire.create.mockResolvedValue({ id: 'fire-2' });

      await AlertRuleService.evaluateIngestAlerts({
        projectId: 'proj-1',
        organizationId: orgId,
        issue: {
          id: 'issue-1',
          title: 'TypeError: null has no properties',
          environment: 'staging',
          fingerprint: 'abc1234',
        },
        isNew: true,
        isRegression: false,
        isIgnored: false,
      });

      expect(mockDb.alertRuleFire.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ ruleId: 'rule-env' }),
      }));
      expect(mockEnqueueNotification).toHaveBeenCalledWith(expect.objectContaining({
        channel: 'webhook',
        recipient: 'https://webhook.site/test',
      }));
    });

    it('evaluates event_rate_threshold during ingest', async () => {
      mockDb.alertRule.count.mockResolvedValue(1);
      mockDb.alertRule.findMany.mockResolvedValue([
        {
          id: 'rule-rate',
          organizationId: orgId,
          name: 'High Rate Rule',
          trigger: 'event_rate_threshold',
          conditions: { threshold: 50, windowSeconds: 60 },
          cooldownSeconds: 300,
          snoozedUntil: null,
          isActive: true,
          channels: [
            {
              id: 'chan-email',
              type: 'email',
              isActive: true,
              config: { recipients: ['devops@example.com'] },
            },
          ],
          fires: [],
        },
      ]);
      mockDb.errorEvent.count.mockResolvedValue(75); // 75 events > threshold 50
      mockDb.alertRuleFire.create.mockResolvedValue({ id: 'fire-3' });

      await AlertRuleService.evaluateIngestAlerts({
        projectId: 'proj-1',
        organizationId: orgId,
        issue: {
          id: 'issue-2',
          title: 'Database connection spike',
          environment: 'production',
          fingerprint: 'def5678',
        },
        isNew: false,
        isRegression: false,
        isIgnored: false,
      });

      expect(mockDb.alertRuleFire.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ ruleId: 'rule-rate' }),
      }));
      expect(mockEnqueueNotification).toHaveBeenCalledWith(expect.objectContaining({
        channel: 'email',
        recipient: ['devops@example.com'],
      }));
    });
  });
});
