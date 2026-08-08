/**
 * Notification Service & Providers Test Suite
 */

import { jest } from '@jest/globals';
import NotificationService from '../src/services/notifications/notificationService.js';
import { NotificationChannels } from '../src/constants.js';

describe('Notification Service & Providers', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should successfully dispatch Slack notification via SlackNotificationProvider', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
    });

    const result = await NotificationService.dispatch(NotificationChannels.SLACK, {
      recipient: 'https://hooks.slack.com/services/test/mock/webhook',
      subject: 'Critical Alert',
      body: 'Service API Gateway is DOWN',
    });

    expect(result.success).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://hooks.slack.com/services/test/mock/webhook',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });

  it('should successfully dispatch Webhook notification via WebhookNotificationProvider', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
    });

    const result = await NotificationService.dispatch(NotificationChannels.WEBHOOK, {
      recipient: 'https://example.com/api/webhooks/incidents',
      subject: 'Incident Created',
      body: 'High severity incident detected',
    });

    expect(result.success).toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.com/api/webhooks/incidents',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'Content-Type': 'application/json' }),
      })
    );
  });

  it('should throw error for unsupported notification channel', async () => {
    await expect(
      NotificationService.dispatch('unsupported_channel', {
        recipient: 'test',
        subject: 'Test',
        body: 'Test',
      })
    ).rejects.toThrow('Unsupported notification channel: unsupported_channel');
  });
});
